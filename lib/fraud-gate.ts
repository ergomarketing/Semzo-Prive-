import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export interface FraudGateResult {
  passed: boolean
  riskScore: number
  checks: Array<{
    type: string
    passed: boolean
    message: string
    details?: any
  }>
  action: "approve" | "reject" | "manual_review"
}

export async function runFraudGate(params: {
  userId: string
  planId: string
  paymentIntentId: string
  amount: number
  ipAddress?: string
  userAgent?: string
}): Promise<FraudGateResult> {
  const { userId, planId, paymentIntentId, amount, ipAddress, userAgent } = params

  console.log(`[FraudGate] Starting fraud checks for user ${userId}, plan ${planId}`)

  const checks: FraudGateResult["checks"] = []
  let totalRiskScore = 0

  // CHECK 1: Duplicate Membership Validation (CRITICAL)
  const duplicateCheck = await checkDuplicateMembership(userId)
  checks.push(duplicateCheck)
  if (!duplicateCheck.passed) {
    totalRiskScore += 100 // Auto-reject
  }

  // CHECK 2: Stripe Radar Score
  const radarCheck = await checkStripeRadar(paymentIntentId)
  checks.push(radarCheck)
  totalRiskScore += radarCheck.details?.riskScore || 0

  // CHECK 3: Payment Method Validation (AVS, CVC, 3DS)
  const paymentCheck = await checkPaymentMethod(paymentIntentId, amount)
  checks.push(paymentCheck)
  totalRiskScore += paymentCheck.details?.riskScore || 0

  // CHECK 4: User Risk Profile
  const userRiskCheck = await checkUserRiskProfile(userId, amount)
  checks.push(userRiskCheck)
  totalRiskScore += userRiskCheck.details?.riskScore || 0

  // Calculate final risk score (0-100)
  const finalRiskScore = Math.min(100, totalRiskScore)

  // Log all checks to database
  await logFraudChecks(userId, paymentIntentId, checks, finalRiskScore)

  // Determine action
  let action: FraudGateResult["action"] = "approve"
  let passed = true

  if (finalRiskScore >= 80 || checks.some((c) => !c.passed && c.type === "duplicate_membership")) {
    action = "reject"
    passed = false
  } else if (finalRiskScore >= 50) {
    action = "manual_review"
    passed = false
  }

  console.log(`[FraudGate] Final result: ${action}, risk score: ${finalRiskScore}`)

  return {
    passed,
    riskScore: finalRiskScore,
    checks,
    action,
  }
}

async function checkDuplicateMembership(userId: string) {
  console.log(`[FraudGate] Checking for duplicate memberships for user ${userId}`)

  const { data: existingMembership, error } = await supabaseAdmin
    .from("profiles")
    .select("membership_status, membership_plan, membership_type")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("[FraudGate] Error checking duplicates:", error)
    return {
      type: "duplicate_membership",
      passed: false,
      message: "Error verificando membresías existentes",
      details: { error: error.message },
    }
  }

  // Check if user already has an active or pending membership
  const hasActiveMembership =
    existingMembership?.membership_status === "active" ||
    existingMembership?.membership_status === "pending_verification"

  if (hasActiveMembership) {
    console.warn(`[FraudGate] BLOCKED: User ${userId} already has active membership`)
    return {
      type: "duplicate_membership",
      passed: false,
      message: "El usuario ya tiene una membresía activa",
      details: {
        currentStatus: existingMembership.membership_status,
        currentPlan: existingMembership.membership_plan,
      },
    }
  }

  return {
    type: "duplicate_membership",
    passed: true,
    message: "No hay membresías duplicadas",
  }
}

async function checkStripeRadar(paymentIntentId: string) {
  console.log(`[FraudGate] Checking Stripe Radar for payment ${paymentIntentId}`)

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    const charges = paymentIntent.charges?.data || []
    const latestCharge = charges[0]

    if (!latestCharge) {
      return {
        type: "stripe_radar",
        passed: true,
        message: "No hay cargo disponible para evaluar",
        details: { riskScore: 0 },
      }
    }

    // Stripe Radar risk level: 'normal', 'elevated', 'highest', 'not_assessed'
    const riskLevel = latestCharge.outcome?.risk_level || "not_assessed"
    const radarRiskScore = latestCharge.outcome?.risk_score || 0

    let localRiskScore = 0
    let passed = true

    if (riskLevel === "elevated") {
      localRiskScore = 40
    } else if (riskLevel === "highest") {
      localRiskScore = 80
      passed = false
    }

    console.log(`[FraudGate] Radar result: ${riskLevel}, score: ${radarRiskScore}`)

    return {
      type: "stripe_radar",
      passed,
      message: `Stripe Radar nivel: ${riskLevel}`,
      details: {
        riskLevel,
        radarRiskScore,
        riskScore: localRiskScore,
        networkStatus: latestCharge.outcome?.network_status,
      },
    }
  } catch (error: any) {
    console.error("[FraudGate] Error checking Radar:", error)
    return {
      type: "stripe_radar",
      passed: true, // Default to pass if we can't check
      message: "Error consultando Stripe Radar",
      details: { riskScore: 0, error: error.message },
    }
  }
}

async function checkPaymentMethod(paymentIntentId: string, amount: number) {
  console.log(`[FraudGate] Checking payment method validation`)

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    const charges = paymentIntent.charges?.data || []
    const latestCharge = charges[0]

    if (!latestCharge?.payment_method_details?.card) {
      return {
        type: "payment_validation",
        passed: true,
        message: "Método de pago no disponible para validar",
        details: { riskScore: 0 },
      }
    }

    const card = latestCharge.payment_method_details.card
    const checks = latestCharge.payment_method_details.card.checks || {}

    let riskScore = 0
    const failures: string[] = []

    // AVS Check (Address Verification)
    if (checks.address_line1_check === "fail") {
      riskScore += 20
      failures.push("AVS dirección falló")
    }
    if (checks.address_postal_code_check === "fail") {
      riskScore += 15
      failures.push("AVS código postal falló")
    }

    // CVC Check
    if (checks.cvc_check === "fail") {
      riskScore += 25
      failures.push("CVC falló")
    }

    // 3D Secure Check
    const requires3DS = amount > 10000 // €100+
    const has3DS = card.three_d_secure?.result === "authenticated"

    if (requires3DS && !has3DS) {
      riskScore += 30
      failures.push("3D Secure no completado para monto alto")
    }

    const passed = riskScore < 50

    console.log(`[FraudGate] Payment validation: ${passed ? "PASS" : "FAIL"}, score: ${riskScore}`)

    return {
      type: "payment_validation",
      passed,
      message: passed ? "Validaciones de pago exitosas" : `Validaciones fallidas: ${failures.join(", ")}`,
      details: {
        riskScore,
        avsCheck: checks.address_line1_check,
        cvcCheck: checks.cvc_check,
        has3DS,
        failures,
      },
    }
  } catch (error: any) {
    console.error("[FraudGate] Error checking payment method:", error)
    return {
      type: "payment_validation",
      passed: true,
      message: "Error validando método de pago",
      details: { riskScore: 0, error: error.message },
    }
  }
}

async function checkUserRiskProfile(userId: string, amount: number) {
  console.log(`[FraudGate] Checking user risk profile for ${userId}`)

  try {
    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("created_at, email, full_name, identity_verified")
      .eq("id", userId)
      .single()

    if (!profile) {
      return {
        type: "user_risk_profile",
        passed: false,
        message: "Usuario no encontrado",
        details: { riskScore: 50 },
      }
    }

    let riskScore = 0
    const flags: string[] = []

    // Check account age
    const accountAgeHours = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60)
    if (accountAgeHours < 1) {
      riskScore += 30
      flags.push("Cuenta muy nueva (< 1 hora)")
    } else if (accountAgeHours < 24) {
      riskScore += 15
      flags.push("Cuenta nueva (< 24 horas)")
    }

    // High amount on new account
    if (accountAgeHours < 48 && amount > 50000) {
      // €500+
      riskScore += 25
      flags.push("Monto alto en cuenta nueva")
    }

    // No identity verification
    if (!profile.identity_verified) {
      riskScore += 10
      flags.push("Sin verificación de identidad completada")
    }

    // Check for previous failed payments
    const { data: failedPayments } = await supabaseAdmin
      .from("payment_history")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "failed")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (failedPayments && failedPayments.length >= 3) {
      riskScore += 20
      flags.push(`${failedPayments.length} pagos fallidos recientes`)
    }

    const passed = riskScore < 40

    console.log(`[FraudGate] User risk profile: ${passed ? "PASS" : "WARN"}, score: ${riskScore}`)

    return {
      type: "user_risk_profile",
      passed,
      message: passed ? "Perfil de usuario normal" : `Alertas: ${flags.join(", ")}`,
      details: {
        riskScore,
        accountAgeHours: Math.round(accountAgeHours),
        flags,
        identityVerified: profile.identity_verified,
      },
    }
  } catch (error: any) {
    console.error("[FraudGate] Error checking user risk:", error)
    return {
      type: "user_risk_profile",
      passed: true,
      message: "Error evaluando perfil de usuario",
      details: { riskScore: 0, error: error.message },
    }
  }
}

async function logFraudChecks(userId: string, paymentIntentId: string, checks: any[], finalRiskScore: number) {
  try {
    await supabaseAdmin.from("fraud_checks").insert(
      checks.map((check) => ({
        user_id: userId,
        payment_intent_id: paymentIntentId,
        check_type: check.type,
        check_status: check.passed ? "passed" : "failed",
        risk_score: check.details?.riskScore || 0,
        details: check.details || {},
      })),
    )

    console.log(`[FraudGate] Logged ${checks.length} fraud checks to database`)
  } catch (error) {
    console.error("[FraudGate] Error logging fraud checks:", error)
  }
}

export async function logAudit(params: {
  actionType: string
  entityType: string
  entityId: string
  actorId?: string
  actorType: "user" | "admin" | "system" | "webhook"
  changes?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId,
      actor_id: params.actorId || null,
      actor_type: params.actorType,
      changes: params.changes || null,
      metadata: params.metadata || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    })

    console.log(`[Audit] Logged: ${params.actionType} on ${params.entityType} ${params.entityId}`)
  } catch (error) {
    console.error("[Audit] Error logging audit:", error)
  }
}
