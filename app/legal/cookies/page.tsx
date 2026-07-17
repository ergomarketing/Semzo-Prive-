"use client"

import { useLocale } from "@/providers/IntlProvider"

export default function CookiesPage() {
  const { locale } = useLocale()
  const es = locale === "es"

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100/40 to-rose-50/30 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-xl p-8 md:p-12">
          <h1 className="font-serif text-4xl text-slate-900 mb-8">{es ? "Política de Cookies" : "Cookie Policy"}</h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 mb-8">
              {es ? (
                <>
                  Este sitio web utiliza cookies propias y de terceros con la finalidad de mejorar la experiencia de
                  navegación y ofrecer funcionalidades relacionadas con el servicio prestado bajo la marca{" "}
                  <strong>Semzo Privé</strong>.
                </>
              ) : (
                <>
                  This website uses first-party and third-party cookies in order to improve the browsing experience and
                  offer functionalities related to the service provided under the <strong>Semzo Privé</strong> brand.
                </>
              )}
            </p>
            <p className="text-slate-700 mb-8">
              {es
                ? "La información recopilada mediante cookies se gestiona conforme a la normativa europea aplicable y se describe de forma detallada en la presente Política de Cookies."
                : "The information collected through cookies is managed in accordance with applicable European regulations and is described in detail in this Cookie Policy."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">
              {es ? "1. ¿Qué son las cookies?" : "1. What are cookies?"}
            </h2>
            <p className="text-slate-700 mb-4">
              {es
                ? "Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los visitas. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio."
                : "Cookies are small text files that websites store on your device when you visit them. They are widely used to make websites work more efficiently, as well as to provide information to site owners."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">
              {es ? "2. Tipos de cookies que utilizamos" : "2. Types of cookies we use"}
            </h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "Cookies esenciales" : "Essential cookies"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "Estas cookies son necesarias para que el sitio web funcione correctamente. Incluyen cookies que te permiten iniciar sesión en áreas seguras de nuestro sitio web o utilizar el carrito de compras."
                : "These cookies are necessary for the website to function properly. They include cookies that allow you to log into secure areas of our website or use the shopping cart."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "Cookies de rendimiento" : "Performance cookies"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "Estas cookies nos permiten contar las visitas y fuentes de tráfico para poder medir y mejorar el rendimiento de nuestro sitio. Nos ayudan a saber qué páginas son las más y menos populares."
                : "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "Cookies de funcionalidad" : "Functionality cookies"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "Estas cookies permiten que el sitio web proporcione una funcionalidad y personalización mejoradas, como recordar tus preferencias de idioma o región."
                : "These cookies enable the website to provide enhanced functionality and personalization, such as remembering your language or region preferences."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">
              {es ? "3. Gestión de cookies" : "3. Managing cookies"}
            </h2>
            <p className="text-slate-700 mb-4">
              {es
                ? "Puedes configurar tu navegador para rechazar todas las cookies o para indicar cuándo se envía una cookie. Sin embargo, si no aceptas las cookies, es posible que no puedas utilizar algunas partes de nuestro sitio web."
                : "You can set your browser to reject all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some parts of our website."}
            </p>
            <p className="text-slate-700 mb-4">
              {es ? "Para obtener más información sobre cómo administrar cookies, visita" : "For more information on how to manage cookies, visit"}{" "}
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

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">{es ? "4. Contacto" : "4. Contact"}</h2>
            <p className="text-slate-700">
              {es
                ? "Si tienes alguna pregunta sobre nuestra política de cookies, contáctanos en:"
                : "If you have any questions about our cookie policy, contact us at:"}
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
              {es ? "Última actualización: Noviembre 2024" : "Last updated: November 2024"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
