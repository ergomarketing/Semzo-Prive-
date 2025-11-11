"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import NewsletterSystem from "@/app/components/newsletter-system"

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="font-serif text-2xl text-slate-900">Newsletter</h1>
            </div>
            <Link href="/" className="font-serif text-xl text-slate-900">
              Semzo Privé
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <NewsletterSystem />
      </div>
    </div>
  )
}
