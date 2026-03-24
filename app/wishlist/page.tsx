"use client"

import { useState } from "react"
import { useAuth } from "../hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag, Loader2 } from "lucide-react"
import { LoginModal } from "@/app/components/login-modal"

export default function WishlistPage() {
  const { user, loading, refetch } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Si no hay usuario y no esta cargando, mostrar el modal
  const shouldShowLogin = !loading && !user

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (shouldShowLogin || showLoginModal) {
    return (
      <main className="pt-24 min-h-screen bg-rose-50/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6 flex items-center justify-center gap-3">
              <Heart className="w-8 h-8 text-rose-500" />
              Mi Lista de Deseos
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Inicia sesión para ver y gestionar tu lista de deseos.
            </p>
          </div>

          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Heart className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-2xl font-serif text-slate-800 mb-4">Accede a tu lista</h3>
              <p className="text-slate-600 mb-6">
                Inicia sesión para guardar tus bolsos favoritos y acceder a ellos desde cualquier dispositivo.
              </p>
              <Button 
                onClick={() => setShowLoginModal(true)} 
                className="bg-slate-800 hover:bg-slate-700"
              >
                Iniciar Sesión
              </Button>
            </div>
          </div>
        </div>

        <LoginModal
          open={showLoginModal || shouldShowLogin}
          onOpenChange={setShowLoginModal}
          onSuccess={async () => {
            setShowLoginModal(false)
            if (refetch) await refetch()
          }}
          onClose={() => setShowLoginModal(false)}
        />
      </main>
    )
  }

  return (
    <main className="pt-24 min-h-screen bg-rose-50/20">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6 flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-rose-500" />
            Mi Lista de Deseos
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Guarda tus bolsos favoritos y mantén un seguimiento de las piezas que más te interesan.
          </p>
        </div>

        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <Heart className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-serif text-slate-800 mb-4">Tu lista está vacía</h3>
            <p className="text-slate-600 mb-6">
              Explora nuestro catálogo y agrega los bolsos que más te gusten a tu lista de deseos.
            </p>
            <Button onClick={() => window.location.href = "/catalog"} className="bg-slate-800 hover:bg-slate-700">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Explorar Catálogo
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
