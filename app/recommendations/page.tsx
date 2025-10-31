"use client"

import { useAuth } from "../hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Crown, Loader2 } from "lucide-react"

export default function RecommendationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const membershipType = user?.user_metadata?.membership_status || "free"
  const isPremium = membershipType === "premium" || membershipType === "prive"

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-rose-50/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6 flex items-center justify-center gap-3">
              Recomendaciones {isPremium && <Crown className="w-8 h-8 text-amber-500" />}
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              {isPremium
                ? "Descubre nuestras recomendaciones premium personalizadas exclusivamente para ti"
                : "Bolsos seleccionados especialmente para tu estilo y preferencias"}
            </p>
          </div>

          {isPremium ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Premium recommendations would be loaded here */}
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-rose-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Recomendación Premium
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Basado en tu historial y preferencias, hemos seleccionado piezas exclusivas para ti.
                  </p>
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600">
                    Ver Colección Premium
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Crown className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-serif text-slate-800 mb-4">Recomendaciones Premium</h3>
                <p className="text-slate-600 mb-6">
                  Upgrade a membresía Privé para acceder a recomendaciones personalizadas y contenido exclusivo.
                </p>
                <Button
                  onClick={() => router.push("/membership/upgrade")}
                  className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade a Privé
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
