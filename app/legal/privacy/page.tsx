"use client"

import { useLocale } from "@/providers/IntlProvider"

export default function PrivacyPage() {
  const { locale } = useLocale()
  const es = locale === "es"

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-xl p-8 md:p-12">
          <h1 className="font-serif text-4xl text-slate-900 mb-8">
            {es ? "Política de Privacidad" : "Privacy Policy"}
          </h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 mb-8">
              {es ? (
                <>
                  La presente Política de Privacidad describe el tratamiento de los datos personales recabados a través
                  del servicio prestado bajo la marca <strong>Semzo Privé</strong>.
                </>
              ) : (
                <>
                  This Privacy Policy describes the processing of personal data collected through the service provided
                  under the <strong>Semzo Privé</strong> brand.
                </>
              )}
            </p>
            <p className="text-slate-700 mb-8">
              {es
                ? "El tratamiento de los datos se realiza conforme a la normativa europea de protección de datos aplicable (Reglamento (UE) 2016/679 – RGPD), aplicando las medidas técnicas y organizativas necesarias para garantizar la seguridad y confidencialidad de la información."
                : "Data processing is carried out in accordance with applicable European data protection regulations (Regulation (EU) 2016/679 – GDPR), applying the technical and organizational measures necessary to guarantee the security and confidentiality of the information."}
            </p>
            <p className="text-slate-700 mb-8 p-4 rounded-lg border-l-4 border-slate-300">
              {es
                ? "En caso de que la titularidad del servicio sea asumida por una entidad jurídica constituida dentro de la Unión Europea, la presente Política será actualizada para reflejar dicha circunstancia."
                : "In the event that ownership of the service is assumed by a legal entity constituted within the European Union, this Policy will be updated to reflect that circumstance."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">
              {es ? "1. Información que recopilamos" : "1. Information we collect"}
            </h2>
            <p className="text-slate-700 mb-4">{es ? "Recopilamos la siguiente información:" : "We collect the following information:"}</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>{es ? "Información personal: nombre, email, teléfono, dirección" : "Personal information: name, email, phone, address"}</li>
              <li>{es ? "Información de pago: datos de tarjeta de crédito (procesados de forma segura)" : "Payment information: credit card details (securely processed)"}</li>
              <li>{es ? "Preferencias: marcas favoritas, colores, ocasiones de uso" : "Preferences: favourite brands, colours, occasions of use"}</li>
              <li>{es ? "Información de uso: cómo interactúas con nuestro sitio web" : "Usage information: how you interact with our website"}</li>
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">
              {es ? "2. Cómo utilizamos tu información" : "2. How we use your information"}
            </h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>{es ? "Procesar tu membresía y envíos" : "Process your membership and shipments"}</li>
              <li>{es ? "Personalizar tu experiencia" : "Personalize your experience"}</li>
              <li>{es ? "Comunicarnos contigo sobre tu cuenta" : "Communicate with you about your account"}</li>
              <li>{es ? "Mejorar nuestros servicios" : "Improve our services"}</li>
              <li>{es ? "Cumplir con obligaciones legales" : "Comply with legal obligations"}</li>
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">
              {es ? "3. Protección de datos" : "3. Data protection"}
            </h2>
            <p className="text-slate-700 mb-4">
              {es
                ? "Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:"
                : "We implement technical and organizational security measures to protect your information:"}
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>{es ? "Encriptación SSL de 256 bits" : "256-bit SSL encryption"}</li>
              <li>{es ? "Servidores seguros y monitoreados" : "Secure and monitored servers"}</li>
              <li>{es ? "Acceso limitado a datos personales" : "Limited access to personal data"}</li>
              <li>{es ? "Auditorías regulares de seguridad" : "Regular security audits"}</li>
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">{es ? "4. Tus derechos" : "4. Your rights"}</h2>
            <p className="text-slate-700 mb-4">{es ? "Bajo el RGPD, tienes derecho a:" : "Under the GDPR, you have the right to:"}</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>{es ? "Acceder a tus datos personales" : "Access your personal data"}</li>
              <li>{es ? "Rectificar información incorrecta" : "Rectify incorrect information"}</li>
              <li>{es ? "Solicitar la eliminación de tus datos" : "Request the deletion of your data"}</li>
              <li>{es ? "Portabilidad de datos" : "Data portability"}</li>
              <li>{es ? "Oponerte al procesamiento" : "Object to processing"}</li>
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">{es ? "5. Cookies" : "5. Cookies"}</h2>
            <p className="text-slate-700 mb-4">
              {es
                ? "Utilizamos cookies para mejorar tu experiencia. Puedes gestionar las preferencias de cookies en la configuración de tu navegador."
                : "We use cookies to improve your experience. You can manage cookie preferences in your browser settings."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">{es ? "6. Contacto" : "6. Contact"}</h2>
            <p className="text-slate-700">
              {es ? "Para cualquier consulta sobre privacidad, contacta con nosotros en:" : "For any privacy inquiries, contact us at:"}
              <br />
              Email:{" "}
              <a href="mailto:info@semzoprive.com" className="text-rose-400 hover:text-rose-500">
                info@semzoprive.com
              </a>
              <br />
              {es ? "Teléfono:" : "Phone:"}{" "}
              <a href="tel:+34624239394" className="text-rose-400 hover:text-rose-500">
                +34 624 239 394
              </a>
            </p>

            <p className="text-sm text-slate-500 mt-8 pt-8 border-t border-slate-200">
              {es ? "Última actualización: Marzo 2024" : "Last updated: March 2024"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
