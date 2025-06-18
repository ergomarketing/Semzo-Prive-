import Link from "next/link"

export default function MyAccountPage() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-slate-900 mb-2">Mi Cuenta</h1>
        <p className="text-slate-600">Gestiona tu perfil, membresías y preferencias</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Perfil */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Mi Perfil</h3>
          </div>
          <div className="mb-4">
            <p className="text-slate-600">Actualiza tu información personal y preferencias de cuenta.</p>
          </div>
          <div>
            <Link href="/my-account/profile" className="w-full">
              <button className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors">
                Ver perfil
              </button>
            </Link>
          </div>
        </div>

        {/* Membresía */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Mi Membresía</h3>
          </div>
          <div className="mb-4">
            <p className="text-slate-600">Revisa tu plan actual y gestiona tu suscripción.</p>
          </div>
          <div>
            <Link href="/my-account/membership" className="w-full">
              <button className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors">
                Ver membresía
              </button>
            </Link>
          </div>
        </div>

        {/* Lista de Deseos */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Lista de Deseos</h3>
          </div>
          <div className="mb-4">
            <p className="text-slate-600">Guarda tus bolsos favoritos y recibe notificaciones.</p>
          </div>
          <div>
            <Link href="/my-account/wishlist" className="w-full">
              <button className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors">
                Ver lista
              </button>
            </Link>
          </div>
        </div>

        {/* Referidos */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Programa de Referidos</h3>
          </div>
          <div className="mb-4">
            <p className="text-slate-600">Invita amigas y gana meses gratis.</p>
          </div>
          <div>
            <Link href="/my-account/referrals" className="w-full">
              <button className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors">
                Ver referidos
              </button>
            </Link>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Newsletter</h3>
          </div>
          <div className="mb-4">
            <p className="text-slate-600">Personaliza tus preferencias de contenido.</p>
          </div>
          <div>
            <Link href="/my-account/newsletter" className="w-full">
              <button className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors">
                Configurar
              </button>
            </Link>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Mis Notificaciones</h3>
          </div>
          <div className="mb-4">
            <p className="text-slate-600">Revisa los emails y notificaciones importantes de tu cuenta.</p>
          </div>
          <div>
            <Link href="/my-account/emails" className="w-full">
              <button className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors">
                Ver notificaciones
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
