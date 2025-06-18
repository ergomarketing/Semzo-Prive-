export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-xl p-8 md:p-12">
          <h1 className="font-serif text-4xl text-slate-900 mb-8">Política de Privacidad</h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 mb-8">
              En Semzo Privé, valoramos y respetamos tu privacidad. Esta política explica cómo recopilamos, utilizamos y
              protegemos tu información personal.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">1. Información que recopilamos</h2>
            <p className="text-slate-700 mb-4">Recopilamos la siguiente información:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Información personal: nombre, email, teléfono, dirección</li>
              <li>Información de pago: datos de tarjeta de crédito (procesados de forma segura)</li>
              <li>Preferencias: marcas favoritas, colores, ocasiones de uso</li>
              <li>Información de uso: cómo interactúas con nuestro sitio web</li>
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">2. Cómo utilizamos tu información</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Procesar tu membresía y envíos</li>
              <li>Personalizar tu experiencia</li>
              <li>Comunicarnos contigo sobre tu cuenta</li>
              <li>Mejorar nuestros servicios</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">3. Protección de datos</h2>
            <p className="text-slate-700 mb-4">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Encriptación SSL de 256 bits</li>
              <li>Servidores seguros y monitoreados</li>
              <li>Acceso limitado a datos personales</li>
              <li>Auditorías regulares de seguridad</li>
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">4. Tus derechos</h2>
            <p className="text-slate-700 mb-4">Bajo el RGPD, tienes derecho a:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Acceder a tus datos personales</li>
              <li>Rectificar información incorrecta</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Portabilidad de datos</li>
              <li>Oponerte al procesamiento</li>
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">5. Cookies</h2>
            <p className="text-slate-700 mb-4">
              Utilizamos cookies para mejorar tu experiencia. Puedes gestionar las preferencias de cookies en la
              configuración de tu navegador.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">6. Contacto</h2>
            <p className="text-slate-700">
              Para cualquier consulta sobre privacidad, contacta con nosotros en:
              <br />
              Email: privacy@semzoprive.com
              <br />
              Teléfono: +34 911 234 567
            </p>

            <p className="text-sm text-slate-500 mt-8 pt-8 border-t border-slate-200">
              Última actualización: Marzo 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
