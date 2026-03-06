"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check } from "lucide-react"

export default function ListaPrivadaClient() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          preferences: {
            source: "lista-privada-marbella",
            newArrivals: true,
            exclusiveOffers: true,
            styleGuides: false,
            events: true,
            membershipUpdates: true,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok && res.status !== 409) {
        setError(data.message || "Error al registrar. Inténtalo de nuevo.")
        return
      }

      setSuccess(true)
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Imagen de fondo con overlay */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/lista-privada-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[#f5f2ee]/80" />

      <header className="border-b border-gray-200/60 bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-serif text-[#1a1a4b]">
            Semzo Privé
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/semzo-20priv-c3-a9.png"
              alt="Semzo Privé"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>

          <h1 className="mb-4 font-serif text-4xl text-[#1a1a4b] md:text-5xl">Has sido invitada</h1>

          <p className="mb-8 text-lg text-gray-600 leading-relaxed">
            Te damos acceso prioritario a SEMZO Privé en Marbella.
          </p>

          {/* Card central */}
          <div className="mb-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <p className="mb-2 text-sm uppercase tracking-wider text-gray-500">Lista privada Marbella</p>
            <p className="mb-2 font-serif text-3xl font-bold text-[#1a1a4b]">Acceso prioritario</p>
            <p className="mb-8 text-sm text-gray-500">
              Recibe acceso anticipado y condiciones especiales cuando abramos plazas.
            </p>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a4b]">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <p className="font-serif text-xl text-[#1a1a4b]">Ya estás en la lista</p>
                <p className="text-sm text-gray-500">Te avisaremos cuando abramos plazas en Marbella.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <Input
                    type="text"
                    placeholder="Nombre"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Input
                    type="tel"
                    placeholder="WhatsApp (opcional)"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="border-gray-300"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90"
                  size="lg"
                >
                  {loading ? "Registrando..." : "Quiero acceso prioritario"}
                </Button>
              </form>
            )}
          </div>

          {/* Bullets */}
          <div className="space-y-4 text-left">
            {[
              "Bolsos de diseñador por suscripción",
              "Desde 59€/mes",
              "Plazas limitadas en Marbella",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1a1a4b]" />
                <p className="text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Semzo Privé. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
