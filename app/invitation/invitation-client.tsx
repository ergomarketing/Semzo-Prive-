"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { toast } from "sonner"

export default function InvitationClient() {
  const [copied, setCopied] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    whatsapp: ""
  })
  const discountCode = "PRIVE50"

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode)
    setCopied(true)
    toast.success("Código copiado")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.email) {
      toast.error("Por favor completa nombre y email")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/invitation-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.alreadyRegistered) {
          toast.info("Ya estás registrado. ¡Tu código es PRIVE50!")
          setIsRegistered(true)
        } else {
          toast.error(data.error || "Error al registrar")
        }
        return
      }

      toast.success("¡Registro exitoso! Tu código es PRIVE50")
      setIsRegistered(true)
    } catch (error) {
      console.error(error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/lista-privada-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[#f8f6f3]/85" />

      <header className="border-b border-gray-200/60 bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-serif text-[#1a1a4b]">
            Semzo Privé
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/images/semzo-20priv-c3-a9.png"
              alt="Semzo Privé"
              width={100}
              height={100}
              className="object-contain"
            />
          </div>

          <h1 className="mb-3 font-serif text-3xl text-[#1a1a4b] md:text-4xl">
            {isRegistered ? "¡Bienvenida!" : "Has Sido Invitada"}
          </h1>

          <p className="mb-6 text-base text-gray-600 leading-relaxed">
            {isRegistered 
              ? "Ya formas parte de nuestro círculo exclusivo. Usa tu código para obtener 50% de descuento."
              : "Bienvenida a nuestro círculo exclusivo de mujeres que aprecian el lujo consciente y el estilo atemporal."
            }
          </p>

          {/* Formulario de registro - solo si no esta registrada */}
          {!isRegistered && (
            <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
              <p className="mb-4 text-sm uppercase tracking-wider text-gray-500">Regístrate para acceder</p>
              
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="border-gray-300 focus:border-[#1a1a4b] focus:ring-[#1a1a4b]"
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-gray-300 focus:border-[#1a1a4b] focus:ring-[#1a1a4b]"
                  required
                />
                <Input
                  type="tel"
                  placeholder="WhatsApp (opcional)"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="border-gray-300 focus:border-[#1a1a4b] focus:ring-[#1a1a4b]"
                />
              </div>

              <Button 
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Obtener Mi Código"
                )}
              </Button>
            </form>
          )}

          {/* Codigo de descuento - siempre visible pero destacado si esta registrada */}
          <div className={`mb-8 rounded-2xl border bg-white p-6 shadow-lg ${isRegistered ? 'border-[#c9a86c] ring-2 ring-[#c9a86c]/20' : 'border-gray-200'}`}>
            <p className="mb-3 text-sm uppercase tracking-wider text-gray-500">Tu Código Exclusivo</p>

            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="font-serif text-3xl font-bold tracking-wider text-[#1a1a4b] md:text-4xl">{discountCode}</span>
              <button
                onClick={handleCopyCode}
                className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50"
                aria-label="Copiar código"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-600" />}
              </button>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xl font-semibold text-[#1a1a4b]">50% Descuento</p>
              <p className="text-sm text-gray-600">En tu primera membresía mensual</p>
            </div>
          </div>

          <div className="mb-8 space-y-3 text-left">
            {[
              "Acceso a nuestra colección exclusiva de bolsos de diseñador",
              "Piezas auténticas y verificadas con garantía",
              "Envío gratis y devoluciones sin complicaciones",
              "Comunidad exclusiva de mujeres con estilo",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#1a1a4b]" />
                <p className="text-gray-700 text-sm">{item}</p>
              </div>
            ))}
          </div>

          <Link href="/#membresias">
            <Button size="lg" className="w-full bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90 md:w-auto md:px-12">
              Activar Mi Membresía
            </Button>
          </Link>

          <p className="mt-4 text-xs text-gray-500">
            El código de descuento se aplica automáticamente al ingresar{" "}
            <span className="font-semibold">{discountCode}</span> durante el checkout. Válido solo para nuevas miembros.
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-200/60 bg-white/70 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Semzo Privé. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
