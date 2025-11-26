export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-xl p-8 md:p-12">
          <h1 className="font-serif text-4xl text-slate-900 mb-8">Términos y Condiciones</h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 mb-8">
              Bienvenida a Semzo Privé. Al utilizar nuestros servicios, aceptas estos términos y condiciones.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">1. Descripción del servicio</h2>
            <p className="text-slate-700 mb-4">
              Semzo Privé es un servicio de suscripción que te permite acceder a bolsos de lujo de diseñador mediante
              una membresía mensual. No vendemos los bolsos, sino que ofrecemos acceso temporal a ellos.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">2. Membresías</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>
                <strong>L'Essentiel (59€/mes):</strong> 1 bolso por mes
              </li>
              <li>
                <strong>Signature (129€/mes):</strong> 2 bolsos por mes
              </li>
              <li>
                <strong>Privé (189€/mes):</strong> 3 bolsos por mes
              </li>
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">3. Responsabilidades del usuario</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Cuidar los bolsos como si fueran propios</li>
              <li>Devolverlos en las fechas acordadas</li>
              <li>Reportar cualquier daño inmediatamente</li>
              <li>No subarrendar o prestar los bolsos</li>
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">4. Daños y pérdidas</h2>
            <p className="text-slate-700 mb-4">
              En caso de daño o pérdida, el usuario será responsable del costo de reparación o reemplazo según la
              valoración de nuestros expertos.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">5. Cancelación</h2>
            <p className="text-slate-700 mb-4">
              Puedes cancelar tu membresía en cualquier momento. La cancelación será efectiva al final del período de
              facturación actual.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">6. Política de devoluciones</h2>
            <p className="text-slate-700 mb-4">
              Los bolsos deben devolverse en un plazo máximo de 30 días. Ofrecemos recogida gratuita en toda España.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">7. Autenticidad y marcas</h2>
            <p className="text-slate-700 mb-4">
              Todos los bolsos disponibles en Semzo Privé son artículos de lujo 100% auténticos. Cada pieza es
              inspeccionada y verificada por nuestro equipo de expertos antes de ser incluida en nuestra colección.
            </p>
            <p className="text-slate-700 mb-4">
              Semzo Privé opera como un servicio independiente de alquiler de artículos de lujo. No somos distribuidores
              autorizados de ninguna de las marcas que aparecen en nuestra plataforma. Las marcas mencionadas son
              propiedad de sus respectivos titulares y se utilizan únicamente con fines descriptivos para identificar
              los productos.
            </p>
            <p className="text-slate-700 mb-4">
              Ninguna de las marcas cuyos productos ofrecemos patrocina, avala o está afiliada comercialmente con Semzo
              Privé.
            </p>

            <p className="text-sm text-slate-500 mt-8 pt-8 border-t border-slate-200">
              Última actualización: Noviembre 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
