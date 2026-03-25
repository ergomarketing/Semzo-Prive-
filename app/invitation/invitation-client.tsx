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
      {/* Background image - IDENTICAL to original */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/lista-privada-bg.jpg"
          alt="Luxury handbags background"
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-[#f8f6f3]/80" />

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          {/* Logo SP - IDENTICAL position */}
          <div className="mb-6 flex justify-center">
            <Image
              src="/images/semzo-20priv-c3-a9.png"
              alt="Semzo Privé"
              width={70}
              height={70}
              className="object-contain"
            />
          </div>

          {/* Title - IDENTICAL styling */}
          <h1 className="mb-4 font-serif text-4xl text-[#1a1a4b] md:text-5xl italic">
            You Have Been Invited
          </h1>

          {/* Subtitle - IDENTICAL */}
          <p className="mb-10 text-base text-gray-600 leading-relaxed max-w-lg mx-auto">
            Welcome to our exclusive circle of women who appreciate conscious luxury and timeless style.
          </p>

          {/* Registration form - shows BEFORE registration */}
          {!isRegistered && (
            <div className="mb-8 rounded-xl bg-white p-8 shadow-sm border border-gray-100">
              <p className="mb-6 text-xs uppercase tracking-[0.2em] text-gray-500">Register to Get Your Code</p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Name"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="border-gray-200 focus:border-[#1a1a4b] focus:ring-[#1a1a4b] h-12 text-base"
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-gray-200 focus:border-[#1a1a4b] focus:ring-[#1a1a4b] h-12 text-base"
                  required
                />
                <Input
                  type="tel"
                  placeholder="WhatsApp (optional)"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="border-gray-200 focus:border-[#1a1a4b] focus:ring-[#1a1a4b] h-12 text-base"
                />

                <Button 
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90 h-12 text-sm uppercase tracking-widest font-medium"
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
            </div>
          )}

          {/* Discount code card - IDENTICAL to original - shows AFTER registration */}
          {isRegistered && (
            <div className="mb-8 rounded-xl bg-white p-8 shadow-sm border border-gray-100">
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-gray-500">Your Exclusive Code</p>

              <div className="mb-6 flex items-center justify-center gap-3">
                <span className="font-serif text-4xl font-bold tracking-wider text-[#1a1a4b]">{discountCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="rounded-md border border-gray-200 p-2 transition-colors hover:bg-gray-50"
                  aria-label="Copy code"
                >
                  {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-400" />}
                </button>
              </div>

              {/* Beige box - IDENTICAL */}
              <div className="rounded-lg bg-[#f5f0e8] p-5">
                <p className="text-2xl font-semibold text-[#1a1a4b]">50% Off</p>
                <p className="text-sm text-gray-600">On your first monthly membership</p>
              </div>
            </div>
          )}

          {/* Benefits list - IDENTICAL styling */}
          <div className="mb-8 space-y-4 text-left max-w-md mx-auto">
            {[
              "Access to our exclusive designer handbag collection",
              "Authentic, verified pieces with guarantee",
              "Free shipping and hassle-free returns",
              "Exclusive community of style-conscious women",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1a1a4b]" />
                <p className="text-gray-700 text-[15px]">{item}</p>
              </div>
            ))}
          </div>

          {/* CTA Button - IDENTICAL */}
          <Link href="/#membresias">
            <Button 
              size="lg" 
              className="bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90 px-12 h-12 text-sm uppercase tracking-widest font-medium rounded-md"
            >
              Activate My Membership
            </Button>
          </Link>

          {/* Disclaimer - only shows after registration */}
          {isRegistered && (
            <p className="mt-6 text-xs text-gray-500">
              The discount code is applied automatically when you enter{" "}
              <span className="font-semibold">{discountCode}</span> during checkout. Valid for new members only.
            </p>
          )}
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-sm py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2026 Semzo Priv&eacute;. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
