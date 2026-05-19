import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const REQUIRED_CORREOS_FIELDS = [
  "shipping_first_name",
  "shipping_last_name_1",
  "shipping_document_type",
  "shipping_document_number",
  "shipping_via_type",
  "shipping_via_name",
  "shipping_door",
  "shipping_postal_code",
  "shipping_city",
  "shipping_province",
  "shipping_phone",
] as const

function getMissingCorreosFields(profile: any): string[] {
  const missing: string[] = []
  for (const field of REQUIRED_CORREOS_FIELDS) {
    const value = profile[field]
    if (!value || (typeof value === "string" && value.trim() === "")) {
      missing.push(field)
    }
  }
  // shipping_phone tiene fallback a phone
  if (missing.includes("shipping_phone") && profile.phone) {
    return missing.filter((f) => f !== "shipping_phone")
  }
  return missing
}

export async function GET() {
  try {
    const { data: shippingData, error } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        phone,
        membership_type,
        shipping_first_name,
        shipping_last_name_1,
        shipping_last_name_2,
        shipping_document_type,
        shipping_document_number,
        shipping_via_type,
        shipping_via_name,
        shipping_number,
        shipping_portal,
        shipping_floor,
        shipping_door,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_province,
        shipping_phone,
        shipping_country,
        created_at,
        updated_at
      `)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching shipping data:", error)
      return NextResponse.json({ error: "Error al obtener información de envío" }, { status: 500 })
    }

    // Fallback: si no hay shipping_phone usar phone del perfil
    const baseList = (shippingData || []).map((u: any) => ({
      ...u,
      shipping_phone: u.shipping_phone || u.phone || null,
    }))

    // Membresía real desde user_memberships
    const userIds = baseList.map((u: any) => u.id)
    const { data: memberships } = await supabase
      .from("user_memberships")
      .select("user_id, membership_type, status")
      .in("user_id", userIds.length ? userIds : ["__none__"])
      .in("status", ["active", "cancelled_active", "limited_access", "past_due", "paused"])

    const membershipByUser = new Map<string, string>()
    for (const m of memberships || []) {
      if (!membershipByUser.has(m.user_id) || m.status === "active") {
        membershipByUser.set(m.user_id, m.membership_type)
      }
    }

    const normalized = baseList.map((u: any) => {
      const missing = getMissingCorreosFields(u)
      return {
        ...u,
        membership_type: membershipByUser.get(u.id) || u.membership_type || null,
        correos_ready: missing.length === 0,
        correos_missing_fields: missing,
      }
    })

    const usersWithShipping = normalized.filter((user) => user.shipping_address || user.shipping_via_name)
    const usersWithoutShipping = normalized.filter((user) => !user.shipping_address && !user.shipping_via_name)

    const stats = {
      total: shippingData?.length || 0,
      withShipping: usersWithShipping.length,
      withoutShipping: usersWithoutShipping.length,
      correosReady: normalized.filter((u) => u.correos_ready).length,
      correosIncomplete: usersWithShipping.filter((u) => !u.correos_ready).length,
      byMembership: {
        prive: usersWithShipping.filter((u) => u.membership_type === "prive").length,
        signature: usersWithShipping.filter((u) => u.membership_type === "signature").length,
        essentiel: usersWithShipping.filter((u) => u.membership_type === "essentiel").length,
        petite: usersWithShipping.filter((u) => u.membership_type === "petite").length,
        free: usersWithShipping.filter((u) => !u.membership_type || u.membership_type === "free").length,
      },
    }

    return NextResponse.json({
      shipping_addresses: usersWithShipping,
      all_users: normalized,
      stats,
      total: usersWithShipping.length,
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/admin/shipping:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
