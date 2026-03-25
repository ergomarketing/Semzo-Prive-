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
    toast.success("Code copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.email) {
      toast.error("Please complete name and email")
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
          toast.info("You're already registered!")
          setIsRegistered(true)
        } else {
          toast.error(data.error || "Registration error")
        }
        return
      }

      toast.success("Registration successful!")
      setIsRegistered(true)
    } catch (error) {
      console.error(error)
      toast.error("Connection error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background image with zoom out effect */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat scale-110"
        style={{ backgroundImage: "url('/images/lista-privada-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[#f8f6f3]/85" />

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          {/* Logo SP */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/semzo-20priv-c3-a9.png"
              alt="Semzo Privé"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>

          <h1 className="mb-4 font-serif text-4xl text-[#1a1a4b] md:text-5xl italic">
            {isRegistered ? "Welcome!" : "You Have Been Invited"}
          </h1>

          <p className="mb-8 text-base text-gray-600 leading-relaxed max-w-lg mx-auto">
            {isRegistered 
              ? "You're now part of our exclusive circle. Use your code to get 50% off your first month."
              : "Welcome to our exclusive circle of women who appreciate conscious luxury and timeless style."
            }
          </p>

          {/* Registration form - only shows if NOT registered */}
          {!isRegistered && (
            <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
              <p className="mb-6 text-sm uppercase tracking-widest text-gray-500">Register to Access Your Code</p>
              
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Name"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="border-gray-300 focus:border-[#1a1a4b] focus:ring-[#1a1a4b] h-12"
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-gray-300 focus:border-[#1a1a4b] focus:ring-[#1a1a4b] h-12"
                  required
                />
                <Input
                  type="tel"
                  placeholder="WhatsApp (optional)"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="border-gray-300 focus:border-[#1a1a4b] focus:ring-[#1a1a4b] h-12"
                />
              </div>

              <Button 
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90 h-12 text-sm uppercase tracking-widest"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Get My Exclusive Code"
                )}
              </Button>
            </form>
          )}

          {/* Discount code - ONLY shows AFTER registration */}
          {isRegistered && (
            <div className="mb-8 rounded-2xl border border-[#c9a86c] bg-white p-8 shadow-lg ring-2 ring-[#c9a86c]/20">
              <p className="mb-4 text-sm uppercase tracking-widest text-gray-500">Your Exclusive Code</p>

              <div className="mb-6 flex items-center justify-center gap-3">
                <span className="font-serif text-4xl font-bold tracking-wider text-[#1a1a4b] md:text-5xl">{discountCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="rounded-lg border border-gray-300 p-2.5 transition-colors hover:bg-gray-50"
                  aria-label="Copy code"
                >
                  {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-600" />}
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-[#f8f6f3] p-4">
                <p className="text-2xl font-semibold text-[#1a1a4b]">50% Off</p>
                <p className="text-sm text-gray-600">On your first monthly membership</p>
              </div>
            </div>
          )}

          {/* Benefits list */}
          <div className="mb-8 space-y-3 text-left">
            {[
              "Access to our exclusive designer handbag collection",
              "Authentic, verified pieces with guarantee",
              "Free shipping and hassle-free returns",
              "Exclusive community of style-conscious women",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#1a1a4b]" />
                <p className="text-gray-700">{item}</p>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link href="/#membresias">
            <Button size="lg" className="w-full bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90 md:w-auto md:px-12 h-12 text-sm uppercase tracking-widest">
              Activate My Membership
            </Button>
          </Link>

          {isRegistered && (
            <p className="mt-4 text-xs text-gray-500">
              The discount code is applied automatically when you enter{" "}
              <span className="font-semibold">{discountCode}</span> during checkout. Valid for new members only.
            </p>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200/60 bg-white/70 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Semzo Privé. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
