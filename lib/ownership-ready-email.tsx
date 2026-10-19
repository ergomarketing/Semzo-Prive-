import type { SupabaseClient } from "@supabase/supabase-js"
import { EmailServiceProduction, buildColeccionaReadyEmail } from "@/app/lib/email-service-production"
import { logEmail } from "@/lib/email-logger"

/**
 * Avisa a la socia de que su crédito ya cubre el precio y puede finalizar la compra (plantilla de Erika:
 * lib/service-emails/colecciona-ready.ts). No la marca como propietaria: la compra solo se cierra en el webhook de Stripe.
 * Best-effort: nunca lanza.
 */
export async function notifyReadyToFinalize(
  supabase: SupabaseClient,
  userId: string,
  bagId: string,
): Promise<void> {
  try {
    const [{ data: profile }, { data: bag }] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", userId).single(),
      supabase.from("bags").select("brand, name, image_url, images").eq("id", bagId).maybeSingle(),
    ])
    if (!profile?.email) return

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"
    const firstImage = Array.isArray(bag?.images) ? (bag?.images as unknown[])[0] : null
    const imageUrl =
      (typeof bag?.image_url === "string" && bag.image_url) ||
      (typeof firstImage === "string" ? firstImage : (firstImage as { url?: string } | null)?.url) ||
      null

    const built = buildColeccionaReadyEmail({
      fullName: profile.full_name,
      bagBrand: bag?.brand || "",
      bagName: bag?.name || "tu bolso",
      imageUrl,
      panelUrl: `${siteUrl}/dashboard`,
    })
    const sent = await EmailServiceProduction.getInstance().sendWithResend({
      to: profile.email,
      subject: built.subject,
      html: built.html,
    })
    await logEmail({
      recipientEmail: profile.email,
      recipientName: profile.full_name || null,
      subject: built.subject,
      emailType: "ownership_ready_to_finalize",
      status: sent ? "sent" : "failed",
    })
  } catch (err) {
    console.error("[ownership] Error enviando aviso de compra lista para finalizar:", err)
  }
}
