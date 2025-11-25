export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100/40 to-rose-50/30 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-xl p-8 md:p-12">
          <h1 className="font-serif text-4xl text-slate-900 mb-8">Política de Cookies</h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 mb-8">
              En Semzo Privé utilizamos cookies para mejorar tu experiencia de navegación. Esta política explica qué son
              las cookies y cómo las utilizamos.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">1. ¿Qué son las cookies?</h2>
            <p className="text-slate-700 mb-4">
              Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los
              visitas. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente, así como
              para proporcionar información a los propietarios del sitio.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">2. Tipos de cookies que utilizamos</h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">Cookies esenciales</h3>
            <p className="text-slate-700 mb-4">
              Estas cookies son necesarias para que el sitio web funcione correctamente. Incluyen cookies que te
              permiten iniciar sesión en áreas seguras de nuestro sitio web o utilizar el carrito de compras.
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">Cookies de rendimiento</h3>
            <p className="text-slate-700 mb-4">
              Estas cookies nos permiten contar las visitas y fuentes de tráfico para poder medir y mejorar el
              rendimiento de nuestro sitio. Nos ayudan a saber qué páginas son las más y menos populares.
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">Cookies de funcionalidad</h3>
            <p className="text-slate-700 mb-4">
              Estas cookies permiten que el sitio web proporcione una funcionalidad y personalización mejoradas, como
              recordar tus preferencias de idioma o región.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">3. Gestión de cookies</h2>
            <p className="text-slate-700 mb-4">
              Puedes configurar tu navegador para rechazar todas las cookies o para indicar cuándo se envía una cookie.
              Sin embargo, si no aceptas las cookies, es posible que no puedas utilizar algunas partes de nuestro sitio
              web.
            </p>
            <p className="text-slate-700 mb-4">
              Para obtener más información sobre cómo administrar cookies, visita{" "}
              <a
                href="https://www.aboutcookies.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-400 hover:text-rose-500 hover:underline font-medium"
              >
                aboutcookies.org
              </a>
              .
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">4. Contacto</h2>
            <p className="text-slate-700">
              Si tienes alguna pregunta sobre nuestra política de cookies, contáctanos en:
            </p>
            <p className="text-slate-700 mt-2">
              Email:{" "}
              <a
                href="mailto:info@semzoprive.com"
                className="text-rose-400 hover:text-rose-500 hover:underline font-medium"
              >
                info@semzoprive.com
              </a>
            </p>

            <p className="text-sm text-slate-500 mt-8 pt-8 border-t border-slate-200">
              Última actualización: Noviembre 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
