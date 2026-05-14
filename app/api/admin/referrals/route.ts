import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface ReferralRow {
  id: string
  referrer_user_id: string
  referred_user_id: string
  referral_code: string
  status: string
  qualified_at: string | null
  reward_applied_at: string | null
  stripe_customer_id: string | null
  created_at: string
}

interface ProfileLite {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  referral_code: string | null
  referral_balance: number | null
}

/**
 * GET /api/admin/referrals
 *
 * Devuelve TODO el panel admin de referidos en una sola peticion:
 *   - stats globales (totales por estado, EUR repartidos, EUR pendientes)
 *   - ranking de top referidoras
 *   - lista completa de referrals con datos del referrer y referida
 *   - lista de saldos por socia (top 50 por balance)
 *
 * Solo lee. Las acciones de mutacion van en PATCH /api/admin/referrals/[id].
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1) Lista cruda de referidos.
    const { data: referralsRaw, error: refErr } = await supabase
      .from("referrals")
      .select(
        "id, referrer_user_id, referred_user_id, referral_code, status, qualified_at, reward_applied_at, stripe_customer_id, created_at",
      )
      .order("created_at", { ascending: false })

    if (refErr) {
      console.error("[v0] admin referrals fetch error:", refErr)
      return NextResponse.json({ error: refErr.message }, { status: 500 })
    }

    const referrals: ReferralRow[] = referralsRaw || []

    // 2) Resolver perfiles involucrados en una sola query.
    const userIds = new Set<string>()
    for (const r of referrals) {
      userIds.add(r.referrer_user_id)
      userIds.add(r.referred_user_id)
    }

    const { data: profilesRaw } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, referral_code, referral_balance")
      .in("id", Array.from(userIds.size ? userIds : ["00000000-0000-0000-0000-000000000000"]))

    const profileMap = new Map<string, ProfileLite>()
    for (const p of (profilesRaw as ProfileLite[]) || []) {
      profileMap.set(p.id, p)
    }

    // 3) Enriquecer cada referral con nombres + emails.
    const enriched = referrals.map((r) => {
      const referrer = profileMap.get(r.referrer_user_id)
      const referred = profileMap.get(r.referred_user_id)
      const fullName = (p?: ProfileLite) =>
        p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "Sin nombre" : "Desconocido"
      return {
        ...r,
        referrer_name: fullName(referrer),
        referrer_email: referrer?.email || null,
        referred_name: fullName(referred),
        referred_email: referred?.email || null,
      }
    })

    // 4) Stats globales.
    const stats = {
      total: enriched.length,
      pending: 0,
      paid: 0,
      qualified: 0,
      rewarded: 0,
      rejected: 0,
      eurosRewarded: 0,
      eurosPendingPayout: 0,
    }
    for (const r of enriched) {
      const s = r.status as keyof typeof stats
      if (s === "pending" || s === "paid" || s === "qualified" || s === "rewarded" || s === "rejected") {
        stats[s] += 1
      }
      // Cada referral rewarded reparte 100 EUR (50 referrer + 50 referida).
      if (r.status === "rewarded") stats.eurosRewarded += 100
      // qualified todavia no aplicado = pendiente de payout.
      if (r.status === "qualified" && !r.reward_applied_at) stats.eurosPendingPayout += 100
    }

    // 5) Ranking top referidoras (por # de qualified+rewarded).
    const rankingMap = new Map<string, { user_id: string; name: string; email: string | null; count: number; rewarded: number }>()
    for (const r of enriched) {
      if (r.status === "qualified" || r.status === "rewarded") {
        const k = r.referrer_user_id
        const cur = rankingMap.get(k) || {
          user_id: k,
          name: r.referrer_name,
          email: r.referrer_email,
          count: 0,
          rewarded: 0,
        }
        cur.count += 1
        if (r.status === "rewarded") cur.rewarded += 1
        rankingMap.set(k, cur)
      }
    }
    const ranking = Array.from(rankingMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 6) Top saldos (socias con referral_balance > 0).
    const { data: balancesRaw } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, referral_code, referral_balance")
      .gt("referral_balance", 0)
      .order("referral_balance", { ascending: false })
      .limit(50)

    const balances = (balancesRaw || []).map((p: any) => ({
      user_id: p.id,
      name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "Sin nombre",
      email: p.email,
      referral_code: p.referral_code,
      balance_euros: Number(p.referral_balance || 0),
    }))

    return NextResponse.json({
      stats,
      referrals: enriched,
      ranking,
      balances,
    })
  } catch (err) {
    console.error("[v0] admin referrals exception:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
