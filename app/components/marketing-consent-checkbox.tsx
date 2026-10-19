"use client"

import { useLocale } from "next-intl"
import { MARKETING_CONSENT_TEXT } from "@/lib/marketing-consent-text"

/**
 * Casilla de consentimiento de marketing por correo. NUNCA premarcada y opcional: no marcarla no impide
 * registrarse ni entrar al catalogo. El texto es el aprobado y se guarda tal cual en marketing_consents.
 */
export function MarketingConsentCheckbox({
  checked,
  onChange,
  disabled,
  id = "marketing-consent",
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
}) {
  const locale = useLocale()
  const text = MARKETING_CONSENT_TEXT[locale === "en" ? "en" : "es"]
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-left text-xs leading-relaxed text-slate-600">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#1a1a4b]"
      />
      <span>{text}</span>
    </label>
  )
}
