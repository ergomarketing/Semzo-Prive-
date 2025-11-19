import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="text-slate-600 hover:text-slate-900 flex items-center mb-8">
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver a la página principal
        </Link>
        <div className="bg-white rounded-xl shadow-xl p-8 md:p-12">
          <h1 className="font-serif text-4xl text-slate-900 mb-8">Términos y Condiciones de Servicio</h1>
          <p className="text-lg text-slate-600 mb-8">
            Bienvenida a Semzo Privé. Al utilizar nuestros servicios, aceptas estos términos y condiciones.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Última actualización: Noviembre 2025
          </p>

          <div className="prose prose-slate max-w-none">
            
            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">1. ACUERDO DE TÉRMINOS</h2>
            <p>
              Estos Términos y Condiciones rigen el uso de la plataforma Semzo Privé (el “Sitio”) y tu membresía, que incluye la posesión temporal de nuestros bolsos de lujo (el “Servicio”). Al usar nuestro Sitio y Servicio, aceptas estos Términos y Condiciones y te comprometes a cumplirlos. Este acuerdo es vinculante desde el momento en que recibes la confirmación de tu cuenta o accedes a cualquier parte del Sitio.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">2. MODIFICACIÓN DE LOS TÉRMINOS</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento sin previo consentimiento. Estos cambios se documentarán en esta sección del Sitio y es responsabilidad de los usuarios y miembros revisar esta sección cada vez que utilicen nuestros servicios.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">3. CUENTA Y REGISTRO</h2>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">3.1 Requisitos</h3>
            <p>
              Solo puedes registrarte si eres mayor de 18 años y resides en España. Al registrarte, garantizas que toda la información proporcionada es precisa, completa y veraz.
            </p>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">3.2 Verificación de Identidad</h3>
            <p>
              Como parte del proceso de registro, nos reservamos el derecho de solicitar información adicional, incluyendo, pero no limitado a, una copia de tu DNI/NIE, pasaporte o una factura de servicios para confirmar tu identidad y dirección. Nos reservamos el derecho de rechazar cualquier solicitud de membresía a nuestra discreción.
            </p>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">3.3 Seguridad de la Cuenta</h3>
            <p>
              Eres el único responsable de mantener la confidencialidad de tu información de cuenta y de todas las actividades que ocurran bajo tu cuenta. Debes notificarnos inmediatamente cualquier uso no autorizado.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">4. MEMBRESÍAS</h2>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">4.1 Tipos de Membresía</h3>
            <p>
              Ofrecemos diferentes niveles de membresía con acceso a distintas colecciones y límites de bolsos. Los detalles de cada nivel se especifican en la sección de Membresías del Sitio.
            </p>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">4.2 Período Mínimo de Membresía</h3>
            <p>
              Al suscribirte, aceptas un **período mínimo de membresía de 3 meses** (90 días). La cancelación antes de este período resultará en el cobro de las cuotas restantes hasta completar los 3 meses.
            </p>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">4.3 Depósito de Garantía (Holding Fee)</h3>
            <p>
              Se cargará un depósito de garantía de **[Monto del Depósito]** al inicio de tu membresía. Este depósito será reembolsado al finalizar tu membresía, siempre y cuando no existan cargos pendientes por daños, pérdidas o cuotas impagadas.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">5. TARIFAS, PAGOS Y CARGOS</h2>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">5.1 Ciclo de Facturación</h3>
            <p>
              La tarifa de membresía se cargará a tu método de pago registrado cada mes en la misma fecha calendario en que te suscribiste.
            </p>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">5.2 Cargos Adicionales</h3>
            <p>
              Aceptas que se te cobren los siguientes cargos adicionales, si aplican:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>**Swaps Adicionales:** [Monto] por cada cambio de bolso que exceda el límite de tu membresía.</li>
              <li>**Entregas/Recogidas Fallidas:** [Monto] por cada intento de entrega o recogida fallido debido a causas imputables al miembro.</li>
              <li>**Cargos por Limpieza:** [Monto] si el bolso requiere una limpieza especializada que exceda el desgaste normal.</li>
              <li>**Cargos por Daños:** Costo de reparación o reemplazo (ver Sección 9).</li>
            </ul>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">5.3 Pagos Fallidos</h3>
            <p>
              Si un pago falla, intentaremos cobrarlo nuevamente en los siguientes [Número] días. Si el pago sigue fallando, tu membresía será suspendida y se aplicarán cargos por pagos fallidos. Nos reservamos el derecho de utilizar el depósito de garantía para cubrir cualquier deuda pendiente.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">6. RESERVAS Y PEDIDOS</h2>
            <p>
              Las reservas se realizan a través del Sitio. La disponibilidad de los bolsos está sujeta a la demanda y al estado de los mismos. Nos reservamos el derecho de cancelar o modificar una reserva si el bolso no está disponible o no cumple con nuestros estándares de calidad.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">7. ENTREGA Y RECOGIDA</h2>
            <p>
              Ofrecemos servicio de entrega y recogida en toda España. Eres responsable de asegurar que haya alguien disponible para recibir y entregar el bolso en las fechas acordadas. Los cargos por intentos fallidos se aplicarán según la Sección 5.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">8. CUIDADO Y DEVOLUCIÓN DE BOLSOS</h2>
            <p>
              Debes cuidar el bolso como si fuera de tu propiedad. El bolso debe devolverse en la fecha acordada y en las mismas condiciones en que fue recibido, exceptuando el desgaste normal.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">9. DAÑOS, PÉRDIDA Y ROBO</h2>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">9.1 Desgaste Normal vs. Daño</h3>
            <p>
              El **desgaste normal** (pequeños rasguños superficiales, ligeras marcas de uso) está cubierto por la membresía. El **daño** es cualquier deterioro que exceda el desgaste normal (manchas permanentes, roturas, quemaduras, daños por agua, etc.).
            </p>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">9.2 Cargos por Daños</h3>
            <p>
              Si el bolso se devuelve con daños por negligencia o mal uso, se te cobrará el **costo total de la reparación** según la valoración de nuestros expertos.
            </p>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">9.3 Pérdida o Robo</h3>
            <p>
              En caso de **pérdida o robo**, serás responsable del **valor total de reemplazo del bolso** (precio de mercado actual). Debes notificar inmediatamente a Semzo Privé y presentar una denuncia policial.
            </p>
            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">9.4 Inspección</h3>
            <p>
              Tu método de pago permanecerá registrado hasta que el bolso haya sido inspeccionado por nuestro equipo de control de calidad. Tienes 60 días para disputar cualquier cargo por daños.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">10. CANCELACIÓN DE MEMBRESÍA</h2>
            <p>
              Para cancelar tu membresía, debes enviar un email a [email de membresía] con al menos **5 días hábiles de antelación** a tu próxima fecha de facturación. La cancelación solo será efectiva una vez que todos los bolsos en tu posesión hayan sido devueltos y se haya confirmado su buen estado.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">11. PROPIEDAD DE LOS BOLSOS</h2>
            <p>
              Semzo Privé mantiene la propiedad total de todos los bolsos en todo momento. La membresía solo te otorga la posesión temporal. No puedes vender, subarrendar o prestar los bolsos a terceros.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">12. USO DEL SITIO WEB</h2>
            <p>
              El uso del Sitio es bajo tu propio riesgo. No garantizamos que el Sitio esté libre de errores o interrupciones.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">13. PROPIEDAD INTELECTUAL</h2>
            <p>
              Todo el contenido del Sitio, incluyendo textos, gráficos, logotipos, imágenes y software, es propiedad de Semzo Privé y está protegido por las leyes de propiedad intelectual.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">14. PRIVACIDAD Y PROTECCIÓN DE DATOS</h2>
            <p>
              El tratamiento de tus datos personales se rige por nuestra Política de Privacidad, disponible en <Link href="/legal/privacy" className="text-indigo-dark underline">/legal/privacy</Link>.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">15. LIMITACIÓN DE RESPONSABILIDAD</h2>
            <p>
              En la máxima medida permitida por la ley, Semzo Privé no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pérdida de beneficios, que resulten del uso o la imposibilidad de usar el Servicio.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">16. LEY APLICABLE Y JURISDICCIÓN</h2>
            <p>
              Estos términos se rigen por las leyes de **España**. Cualquier disputa que surja en relación con estos términos se someterá a la jurisdicción exclusiva de los tribunales de **[Ciudad, España]**.
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4">17. CONTACTO</h2>
            <p>
              Para cualquier pregunta o aclaración sobre estos términos, por favor contáctanos en [email de contacto].
            </p>

            <p className="text-sm text-slate-500 mt-8 pt-8 border-t border-slate-200">
              © 2025 Semzo Privé. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
