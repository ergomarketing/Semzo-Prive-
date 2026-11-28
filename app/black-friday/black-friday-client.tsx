"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Copy } from "lucide-react"
import { useCart } from "@/app/contexts/cart-context"

const PROMO_CODE = "BLACKPRIVE"

const offers = [
  {
    id: "essentiel",
    name: "L'Essentiel",
    cartName: "ESSENTIEL",
    price: "118 €",
    oldPrice: "141,60 €",
    cartPrice: "142€",
    image: "/images/membership-essentiel.jpeg",
    brand: "Valentino",
    description: "Membresía trimestral L'Essentiel",
    highlight: false,
  },
  {
    id: "signature",
    name: "Signature",
    cartName: "SIGNATURE",
    price: "298 €",
    oldPrice: "357,60 €",
    cartPrice: "357€",
    image: "/images/membership-signature-v2.jpg",
    brand: "Dior",
    description: "Membresía trimestral Signature",
    highlight: true,
  },
  {
    id: "prive",
    name: "Privé",
    cartName: "PRIVÉ",
    price: "558 €",
    oldPrice: "669,60 €",
    cartPrice: "669€",
    image: "/images/membership-prive.jpg",
    brand: "Chanel",
    description: "Membresía trimestral Privé",
    highlight: false,
  },
]

type Offer = (typeof offers)[number]

export default function BlackFridayClient() {
  const router = useRouter()
  const { addItem } = useCart()
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({ name: "", email: "" })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleChoose = (offer: Offer) => {
    const period = "quarterly" as const

    localStorage.setItem(
      "selectedMembership",
      JSON.stringify({
        id: offer.id,
        name: offer.name,
        price: offer.cartPrice,
        billingCycle: period,
        description: offer.description,
        image: offer.image,
        brand: offer.brand,
        popular: offer.highlight,
      }),
    )

    addItem({
      id: `${offer.id}-membership-${period}`,
      name: offer.cartName,
      price: offer.cartPrice,
      billingCycle: period,
      description: offer.description,
      image: offer.image,
      brand: offer.brand,
      itemType: "membership",
      period,
    })

    router.push("/cart")
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

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
          phone: null,
          preferences: {
            source: "black-friday-2026",
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
        className="fixed inset-0 -z-10 bg-contain bg-center bg-no-repeat"
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

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/semzo-20priv-c3-a9.png"
              alt="Semzo Privé"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>

          <h1 className="mb-4 text-balance font-serif text-4xl text-[#1a1a4b] md:text-5xl">Tres meses. Pagas dos.</h1>

          <p className="mx-auto mb-12 max-w-2xl text-pretty text-lg leading-relaxed text-gray-600">
            Black Friday Privé. Membresía trimestral con el código {PROMO_CODE}. Hasta el lunes 30 a medianoche.
          </p>

          {/* Tarjetas de membresía */}
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={`flex flex-col rounded-2xl border bg-white p-8 shadow-lg ${
                  offer.highlight ? "border-[#1a1a4b]" : "border-gray-200"
                }`}
              >
                <p className="mb-2 text-sm uppercase tracking-wider text-gray-500">Membresía trimestral</p>
                <h2 className="mb-6 font-serif text-3xl text-[#1a1a4b]">{offer.name}</h2>

                <div className="mb-8 flex flex-1 flex-col items-center justify-center gap-1">
                  <p className="font-serif text-4xl font-bold text-[#1a1a4b]">{offer.price}</p>
                  <p className="text-sm text-gray-500">los tres meses</p>
                  <p className="text-sm text-gray-400">
                    <span className="sr-only">Precio anterior: </span>
                    antes <span className="line-through">{offer.oldPrice}</span>
                  </p>
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={() => handleChoose(offer)}
                  className="w-full bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90"
                >
                  Elegir {offer.name}
                </Button>
              </div>
            ))}
          </div>

          {/* Bloque del código */}
          <div className="mx-auto mb-12 max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <p className="mb-2 text-sm uppercase tracking-wider text-gray-500">Tu código</p>
            <p className="mb-6 font-serif text-5xl font-bold tracking-widest text-[#1a1a4b] md:text-6xl">{PROMO_CODE}</p>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleCopy}
              className="border-[#1a1a4b] text-[#1a1a4b] hover:bg-[#1a1a4b]/5"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Código copiado" : "Copiar código"}
            </Button>
            <p className="mt-4 text-sm text-gray-500">Escríbelo al pagar</p>
            <p className="sr-only" aria-live="polite">
              {copied ? "Código copiado al portapapeles" : ""}
            </p>
          </div>

          <p className="mb-16 text-pretty text-gray-700">
            Envío gratis en 24–48 h · Cambia de bolso cuando quieras · Sin permanencia tras el trimestre
          </p>

          {/* Newsletter */}
          <div className="mx-auto max-w-md border-t border-gray-200 pt-10">
            <p className="mb-4 text-sm text-gray-600">¿Aún no te decides? Únete a la lista.</p>

            {success ? (
              <p className="flex items-center justify-center gap-2 text-sm text-[#1a1a4b]">
                <Check className="h-4 w-4" />
                Ya estás en la lista
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="bf-name" className="sr-only">
                  Nombre
                </label>
                <Input
                  id="bf-name"
                  type="text"
                  placeholder="Nombre"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border-gray-300 bg-white"
                />
                <label htmlFor="bf-email" className="sr-only">
                  Email
                </label>
                <Input
                  id="bf-email"
                  type="email"
                  placeholder="Email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="border-gray-300 bg-white"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  variant="outline"
                  className="border-[#1a1a4b] text-[#1a1a4b] hover:bg-[#1a1a4b]/5"
                >
                  {loading ? "Enviando..." : "Unirme"}
                </Button>
              </form>
            )}
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Semzo Privé. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
