'use client'

import { useSession } from '@supabase/auth-helpers-react'
import Link from 'next/link'

export default function MyAccountPage() {
  const session = useSession()

  if (!session) {
    return <p className="text-center py-10">Debes iniciar sesión para ver esta página.</p>
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-serif text-slate-900 mb-2">Mi Cuenta</h1>
      <p className="text-slate-600">Gestiona tu perfil, membresía y preferencias</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-2">Mi Perfil</h3>
          <p className="text-slate-600">Actualiza tu información personal y preferencias de cuenta.</p>
          <Link href="/my-account/profile" className="w-full">
            <button className="mt-4 px-4 py-2 border rounded-md text-slate-700 hover:bg-slate-50 transition-colors">Ver perfil</button>
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-2">Membresía</h3>
          <p className="text-slate-600">Revisa tu plan actual y gestiona tu suscripción.</p>
          <Link href="/my-account/membership" className="w-full">
            <button className="mt-4 px-4 py-2 border rounded-md text-slate-700 hover:bg-slate-50 transition-colors">Ver membresía</button>
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-2">Lista de Deseos</h3>
          <p className="text-slate-600">Lista de bolsos que has marcado como favoritos.</p>
          <Link href="/wishlist" className="w-full">
            <button className="mt-4 px-4 py-2 border rounded-md text-slate-700 hover:bg-slate-50 transition-colors">Ver favoritos</button>
          </Link>
        </div>
      </div>
    </div>
  )
}
