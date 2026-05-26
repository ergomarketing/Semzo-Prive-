"use client"

import { useState } from "react"
import { Lock, Sparkles } from "lucide-react"

interface CatalogGateOverlayProps {
  onUnlock: () => void
}

export default function CatalogGateOverlay({ onUnlock }: CatalogGateOverlayProps) {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !email.includes("@")) {
      setError("Introduce un email valido")
      return
    }
    if (!fullName.trim()) {
      setError("Introduce tu nombre")
      return
    }

    setLoading(true)
    try {
      // capturar UTMs si vienen en la URL
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
        throw new Error(d.error || "Error al solicitar acceso")
      }
      onUnlock()
    } catch (err: any) {
      setError(err.message || "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop con blur */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-rose-nude/30">
        <div className="bg-gradient-to-b from-rose-nude/20 to-white px-8 pt-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <p className="text-xs tracking-[0.2em] uppercase text-slate-500 mb-2 font-sans">
            Acceso Exclusivo
          </p>
          <h2 className="font-serif text-2xl md:text-3xl text-slate-900 mb-2 text-balance">
            Catalogo Privado Semzo Prive
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Descubre nuestra coleccion completa de bolsos de lujo. Acceso reservado a futuras socias.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-3">
          <div>
            <label htmlFor="cg-name" className="sr-only">Nombre completo</label>
            <input
              id="cg-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nombre completo"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="cg-email" className="sr-only">Email</label>
            <input
              id="cg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="cg-whatsapp" className="sr-only">WhatsApp (opcional)</label>
            <input
              id="cg-whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="WhatsApp (opcional)"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              autoComplete="tel"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg text-sm font-medium tracking-wide uppercase transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              "Verificando..."
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Acceder al catalogo
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center pt-2 leading-relaxed">
            Al continuar aceptas recibir comunicaciones de Semzo Prive. Puedes darte de baja en cualquier momento.
          </p>
        </form>
      </div>
    </div>
  )
}
