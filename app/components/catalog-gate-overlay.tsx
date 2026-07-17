"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

interface CatalogGateOverlayProps {
  onUnlock: () => void
}

export default function CatalogGateOverlay({ onUnlock }: CatalogGateOverlayProps) {
  const t = useTranslations("catalogGate")
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !email.includes("@")) {
      setError(t("errorEmail"))
      return
    }
    if (!fullName.trim()) {
      setError(t("errorName"))
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams(window.location.search)
      const res = await fetch("/api/catalog-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          full_name: fullName,
          whatsapp,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || t("errorRequest"))
      }
      onUnlock()
    } catch (err: any) {
      setError(err.message || t("errorUnexpected"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md py-12 px-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl my-auto">
        <div className="grid md:grid-cols-2">
          {/* Imagen lado izquierdo - mismo formato que login */}
          <div className="relative hidden md:block min-h-[600px]">
            <img
              src="/images/login-modal-chanel.jpg"
              alt={t("imageAlt")}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm font-medium" style={{ color: "#1a1a4b" }}>
                  {t("badgeTitle")}
                </p>
                <p className="text-xs text-slate-600 mt-1">{t("badgeSubtitle")}</p>
              </div>
            </div>
          </div>

          {/* Formulario lado derecho */}
          <div className="p-8 md:p-10 flex items-center">
            <div className="w-full max-w-sm mx-auto">
              <div className="text-center mb-8">
                <p className="text-xs tracking-[0.25em] uppercase text-slate-500 mb-3">
                  {t("eyebrow")}
                </p>
                <h2 className="font-serif text-3xl font-light mb-3 text-balance" style={{ color: "#1a1a4b" }}>
                  {t("title")}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="cg-name" className="text-sm font-medium block" style={{ color: "#1a1a4b" }}>
                    {t("fullName")}
                  </label>
                  <input
                    id="cg-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("fullNamePlaceholder")}
                    className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a4b]"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cg-email" className="text-sm font-medium block" style={{ color: "#1a1a4b" }}>
                    {t("email")}
                  </label>
                  <input
                    id="cg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a4b]"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cg-whatsapp" className="text-sm font-medium block" style={{ color: "#1a1a4b" }}>
                    {t("whatsapp")} <span className="text-xs text-slate-400 font-normal">{t("optional")}</span>
                  </label>
                  <input
                    id="cg-whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder={t("whatsappPlaceholder")}
                    className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a4b]"
                    autoComplete="tel"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-lg text-sm uppercase tracking-widest font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: "#1a1a4b", color: "#ffffff" }}
                >
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : t("submit")}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
                {t("consent")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
