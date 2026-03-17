"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function InvitationClient() {
  const [copied, setCopied] = useState(false)
  const discountCode = "PRIVE50"

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative min-h-screen">
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

          <h1 className="mb-4 font-serif text-4xl text-[#1a1a4b] md:text-5xl">You Have Been Invited</h1>

          <p className="mb-8 text-lg text-gray-600 leading-relaxed">
            Welcome to our exclusive circle of women who appreciate conscious luxury and timeless style.
          </p>

          <div className="mb-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <p className="mb-4 text-sm uppercase tracking-wider text-gray-500">Your Exclusive Code</p>

            <div className="mb-6 flex items-center justify-center gap-4">
              <span className="font-serif text-4xl font-bold tracking-wider text-[#1a1a4b]">{discountCode}</span>
              <button
                onClick={handleCopyCode}
                className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50"
                aria-label="Copy code"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-600" />}
              </button>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <p className="text-2xl font-semibold text-[#1a1a4b]">50% Off</p>
              <p className="text-sm text-gray-600">On your first monthly membership</p>
            </div>
          </div>

          <div className="mb-12 space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#1a1a4b]" />
              <p className="text-gray-700">Access to our designer handbag collection</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#1a1a4b]" />
              <p className="text-gray-700">Authentic, verified pieces with guarantee</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#1a1a4b]" />
              <p className="text-gray-700">Free shipping and hassle-free returns</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#1a1a4b]" />
              <p className="text-gray-700">Exclusive community of style-conscious women</p>
            </div>
          </div>

          <Link href="/#membresias">
            <Button size="lg" className="w-full bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90 md:w-auto">
              Activate My Membership
            </Button>
          </Link>

          <p className="mt-6 text-xs text-gray-500">
            The discount code is applied automatically when you enter{" "}
            <span className="font-semibold">{discountCode}</span> during checkout. Valid for new members only.
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-200/60 bg-white/70 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Semzo Privé. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
