"use client"

import { useLocale } from "@/providers/IntlProvider"

export default function TermsPage() {
  const { locale } = useLocale()
  const es = locale === "es"

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-xl p-8 md:p-12">
          <h1 className="font-serif text-4xl text-slate-900 mb-8">
            {es ? "Términos y Condiciones de Servicio" : "Terms and Conditions of Service"}
          </h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 mb-8 p-4 rounded-lg border-l-4 border-slate-300">
              <strong>{es ? "Importante:" : "Important:"}</strong>{" "}
              {es
                ? "Por favor, lea estos términos detenidamente antes de utilizar nuestros servicios. Al crear una cuenta, realizar una reserva o utilizar cualquiera de nuestros servicios, usted acepta estar legalmente vinculado por estos Términos y Condiciones, nuestra Política de Privacidad y cualquier otra directriz o política publicada en nuestro sitio web."
                : "Please read these terms carefully before using our services. By creating an account, making a reservation or using any of our services, you agree to be legally bound by these Terms and Conditions, our Privacy Policy and any other guidelines or policies published on our website."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es
                ? "NATURALEZA DEL SERVICIO · TITULARIDAD · ACEPTACIÓN CONTRACTUAL"
                : "NATURE OF THE SERVICE · OWNERSHIP · CONTRACTUAL ACCEPTANCE"}
            </h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "1. Naturaleza del servicio" : "1. Nature of the service"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "SEMZO PRIVÉ presta un servicio de alquiler temporal de bolsos de lujo bajo modalidad de suscripción con rotación, dirigido a clientas particulares, mediante el cual se concede un derecho de uso limitado, personal y no exclusivo sobre los artículos seleccionados a través de la plataforma, durante el periodo de alquiler contratado."
                : "SEMZO PRIVÉ provides a temporary luxury bag rental service under a rotating subscription model, aimed at individual clients, granting a limited, personal and non-exclusive right of use over the articles selected through the platform during the contracted rental period."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "En ningún caso el servicio prestado por SEMZO PRIVÉ podrá interpretarse como una venta, cesión definitiva, leasing financiero, arrendamiento con opción de compra, ni como cualquier otra figura jurídica que implique la transmisión de la propiedad, posesión permanente o expectativa de adquisición del bolso."
                : "Under no circumstances may the service provided by SEMZO PRIVÉ be interpreted as a sale, definitive transfer, financial lease, hire-purchase, or any other legal form implying transfer of ownership, permanent possession or expectation of acquiring the bag."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "La titularidad jurídica y material de todos los bolsos corresponde en todo momento, de forma exclusiva y sin excepción, a SEMZO PRIVÉ, con independencia de la duración del alquiler, del número de renovaciones realizadas o del importe abonado por la clienta en concepto de suscripción."
                : "Legal and material ownership of all bags belongs at all times, exclusively and without exception, to SEMZO PRIVÉ, regardless of the rental duration, the number of renewals made or the amount paid by the member as a subscription fee."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "2. Derecho de uso limitado" : "2. Limited right of use"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "El derecho concedido a la clienta se limita estrictamente al uso personal, ordinario y diligente del bolso durante el periodo de alquiler activo, quedando expresamente prohibido cualquier uso que exceda dicho marco, incluyendo, a título meramente enunciativo y no limitativo:"
                : "The right granted to the member is strictly limited to personal, ordinary and diligent use of the bag during the active rental period. Any use exceeding this scope is expressly prohibited, including but not limited to:"}
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
              {es ? (
                <>
                  <li>la cesión, préstamo, subarrendamiento o puesta a disposición del bolso a terceros;</li>
                  <li>el uso con fines comerciales, promocionales o profesionales;</li>
                  <li>la utilización del bolso como garantía, prenda o medio de pago;</li>
                  <li>cualquier manipulación, alteración, personalización o intervención sobre el artículo.</li>
                </>
              ) : (
                <>
                  <li>assigning, lending, subleasing or making the bag available to third parties;</li>
                  <li>use for commercial, promotional or professional purposes;</li>
                  <li>using the bag as collateral, pledge or means of payment;</li>
                  <li>any manipulation, alteration, personalisation or intervention on the article.</li>
                </>
              )}
            </ul>
            <p className="text-slate-700 mb-4">
              {es
                ? "Cualquier uso no autorizado será considerado incumplimiento contractual grave, con las consecuencias previstas en el presente documento."
                : "Any unauthorised use will be considered a serious contractual breach, with the consequences set out in this document."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "3. Aceptación expresa y carácter vinculante" : "3. Express acceptance and binding nature"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "La contratación del servicio implica la aceptación expresa, íntegra y sin reservas del presente documento, así como de las políticas complementarias accesibles a través del sitio web de SEMZO PRIVÉ."
                : "Contracting the service implies express, complete and unreserved acceptance of this document, as well as the supplementary policies accessible through the SEMZO PRIVÉ website."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "Dicha aceptación se entiende formalizada en el momento en que la clienta completa el proceso de contratación y confirma el pago correspondiente, sin que sea necesaria la firma manuscrita del presente documento para su plena validez y eficacia jurídica."
                : "Such acceptance is deemed formalised at the moment the member completes the contracting process and confirms the corresponding payment, without the need for a handwritten signature of this document for its full legal validity and effect."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "La clienta declara haber leído, comprendido y aceptado las presentes condiciones, reconociendo que el servicio ofrecido implica la puesta a disposición temporal de bienes de alto valor económico y que, en consecuencia, conlleva obligaciones específicas de diligencia, custodia y responsabilidad."
                : "The member declares to have read, understood and accepted these terms, acknowledging that the service offered involves the temporary provision of high-value goods and consequently entails specific obligations of diligence, custody and responsibility."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "4. Prevalencia del contrato" : "4. Precedence of the contract"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "El presente documento constituye el marco contractual principal del servicio. En caso de contradicción entre lo aquí dispuesto y cualquier contenido informativo, promocional o explicativo publicado en la web, prevalecerá siempre lo establecido en estas condiciones contractuales."
                : "This document constitutes the main contractual framework of the service. In the event of any contradiction between what is set out here and any informational, promotional or explanatory content published on the website, these contractual terms shall always prevail."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "5. Información de la Empresa" : "5. Company Information"}
            </h2>
            <p className="text-slate-700 mb-4">
              {es ? (
                <>
                  Estos Términos y Condiciones regulan el acceso y uso del servicio ofrecido bajo la marca{" "}
                  <strong>Semzo Privé</strong>, consistente en un servicio premium de alquiler de bolsos de lujo mediante suscripción.
                </>
              ) : (
                <>
                  These Terms and Conditions govern access to and use of the service offered under the{" "}
                  <strong>Semzo Privé</strong> brand, consisting of a premium luxury bag rental service by subscription.
                </>
              )}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "A efectos de estos Términos, cuando se utilicen las expresiones \"Semzo Privé\", \"nosotros\", \"nuestro\" o \"el servicio\", se entenderá que hacen referencia a la plataforma y servicio operado bajo la marca Semzo Privé, y no necesariamente a una entidad jurídica específica, hasta que se formalice su estructura societaria definitiva dentro de la Unión Europea."
                : "For the purposes of these Terms, the expressions \"Semzo Privé\", \"we\", \"our\" or \"the service\" refer to the platform and service operated under the Semzo Privé brand, and not necessarily to a specific legal entity, until its definitive corporate structure within the European Union is formalised."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "Al acceder o utilizar nuestros servicios, usted (en adelante, \"el Usuario\", \"la Socia\", \"usted\") acepta cumplir y quedar vinculado por estos Términos y Condiciones, nuestra Política de Privacidad y cualquier otra directriz o política publicada en nuestro sitio web."
                : "By accessing or using our services, you (hereinafter \"the User\", \"the Member\", \"you\") agree to comply with and be bound by these Terms and Conditions, our Privacy Policy and any other guidelines or policies published on our website."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "6. Descripción del Servicio" : "6. Description of the Service"}
            </h2>
            <p className="text-slate-700 mb-4">
              {es ? (
                <>
                  Semzo Privé ofrece un servicio exclusivo de <strong>alquiler por suscripción</strong> de artículos de lujo autenticados, principalmente bolsos de diseñador de marcas premium. Este servicio <strong>NO</strong>{" "}
                  constituye una venta, cesión de propiedad ni transferencia de titularidad de los artículos.
                </>
              ) : (
                <>
                  Semzo Privé offers an exclusive <strong>subscription rental</strong> service for authenticated luxury items, primarily designer bags from premium brands. This service does <strong>NOT</strong>{" "}
                  constitute a sale, transfer of ownership or change of title of the articles.
                </>
              )}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "6.1 Estado y Autenticidad de los Artículos" : "6.1 Condition and Authenticity of Articles"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "Todos los bolsos que se ofrecen en nuestra suscripción son nuevos a estrenar o usados, pero en cualquier caso todos y cada uno de ellos se encuentran en buen estado."
                : "All bags offered in our subscription are either brand new or pre-owned, but in all cases each and every one of them is in good condition."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "Todas las piezas son genuinas y autenticadas y pueden contener un chip de identificación que verifica la integridad de la pieza y que esta no es intercambiada por otra."
                : "All pieces are genuine and authenticated and may contain an identification chip that verifies the integrity of the piece and that it has not been swapped for another."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "Dicho chip de identificación solo podrá ser leído a corta distancia (menos de 5 centímetros en condiciones normales) y en ningún momento pueden transmitir información autónomamente, identificar ni localizar al Usuario, y se utilizan como herramienta de control de stock y autenticidad."
                : "This identification chip can only be read at short range (less than 5 centimetres under normal conditions) and can never transmit information autonomously, identify or locate the User; it is used solely as a stock control and authenticity tool."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "6.2 Garantías del Servicio" : "6.2 Service Guarantees"}
            </h3>
            <p className="text-slate-700 mb-4">
              <strong>{es ? "Aclaraciones importantes:" : "Important clarifications:"}</strong>
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
              {es ? (
                <>
                  <li>Los artículos permanecen en todo momento como propiedad exclusiva de Semzo Privé</li>
                  <li>El servicio otorga únicamente un <strong>derecho de uso temporal</strong> durante el período activo de la membresía</li>
                  <li>Cada artículo está protegido por un seguro corporativo contra daños, pérdidas o robos</li>
                  <li>La autenticidad de cada artículo está garantizada mediante certificación de expertos independientes</li>
                </>
              ) : (
                <>
                  <li>Articles remain at all times the exclusive property of Semzo Privé</li>
                  <li>The service grants only a <strong>temporary right of use</strong> during the active membership period</li>
                  <li>Each article is protected by corporate insurance against damage, loss or theft</li>
                  <li>The authenticity of each article is guaranteed through certification by independent experts</li>
                </>
              )}
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "7. PLANES DE MEMBRESÍA Y FACTURACIÓN" : "7. MEMBERSHIP PLANS AND BILLING"}
            </h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "7.1 Planes disponibles" : "7.1 Available plans"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "La disponibilidad de los bolsos no está garantizada y puede variar en función del stock. SEMZO PRIVÉ podrá proponer alternativas equivalentes dentro de la misma categoría cuando un modelo no esté disponible."
                : "Bag availability is not guaranteed and may vary depending on stock. SEMZO PRIVÉ may propose equivalent alternatives within the same category when a model is unavailable."}
            </p>
            <p className="text-slate-700 mb-4">
              {es ? "Los planes de membresía disponibles son los siguientes:" : "The available membership plans are as follows:"}
            </p>

            <div className="space-y-6 mb-6">
              <div className="p-6 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-lg text-slate-900 mb-3">Petite (19.99 € / {es ? "mes" : "month"})</h4>
                <p className="text-slate-700 mb-2">
                  {es
                    ? "La membresía Petite consiste en una cuota mensual fija de 19,99 €, que da acceso al servicio de alquiler de bolsos."
                    : "The Petite membership consists of a fixed monthly fee of €19.99, which gives access to the bag rental service."}
                </p>
                <p className="text-slate-700 mb-2">
                  {es ? (
                    <>Este plan <strong>no incluye cambios de bolso de forma gratuita</strong>.</>
                  ) : (
                    <>This plan <strong>does not include free bag changes</strong>.</>
                  )}
                </p>
                <p className="text-slate-700 mb-2">
                  {es
                    ? "La clienta podrá, no obstante, adquirir Pases de Bolso adicionales para cambiar de bolso, con un límite máximo de cuatro (4) cambios por mes de membresía."
                    : "The member may, however, purchase additional Bag Passes to change bags, with a maximum limit of four (4) changes per membership month."}
                </p>
                <p className="text-slate-700">
                  {es
                    ? "Cada cambio requiere la compra de un Pase de Bolso, cuyo precio dependerá de la categoría del bolso elegido."
                    : "Each change requires the purchase of a Bag Pass, the price of which will depend on the category of the chosen bag."}
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-lg text-slate-900 mb-3">{es ? "Pases de Bolso" : "Bag Passes"}</h4>
                <p className="text-slate-700 mb-3">
                  {es
                    ? "El precio de cada Pase de Bolso dependerá de la categoría del bolso seleccionado, conforme al siguiente detalle:"
                    : "The price of each Bag Pass will depend on the category of the selected bag, as detailed below:"}
                </p>
                <ul className="list-disc pl-6 text-slate-700 space-y-2">
                  <li><strong>L'Essentiel:</strong> 52 € {es ? "por Pase de Bolso" : "per Bag Pass"}</li>
                  <li><strong>Signature:</strong> 99 € {es ? "por Pase de Bolso" : "per Bag Pass"}</li>
                  <li><strong>Privé:</strong> 137 € {es ? "por Pase de Bolso" : "per Bag Pass"}</li>
                </ul>
                <p className="text-slate-700 mt-3">
                  {es
                    ? "Cada Pase de Bolso habilita un único cambio de bolso, sujeto a disponibilidad y a las condiciones generales del servicio."
                    : "Each Bag Pass enables a single bag change, subject to availability and the general conditions of the service."}
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-lg text-slate-900 mb-3">L'Essentiel (59 € / {es ? "mes" : "month"})</h4>
                <p className="text-slate-700 mb-2">
                  {es
                    ? "Acceso a un (1) bolso al mes de colecciones seleccionadas, conforme a las condiciones del servicio."
                    : "Access to one (1) bag per month from selected collections, in accordance with the service conditions."}
                </p>
                <p className="text-slate-700">
                  {es
                    ? "Este plan no permite cambios de bolso adicionales durante el periodo mensual."
                    : "This plan does not allow additional bag changes during the monthly period."}
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-lg text-slate-900 mb-3">Signature (149 € / {es ? "mes" : "month"})</h4>
                <p className="text-slate-700 mb-2">
                  {es
                    ? "Acceso a un (1) bolso al mes de colecciones premium, conforme a las condiciones del servicio."
                    : "Access to one (1) bag per month from premium collections, in accordance with the service conditions."}
                </p>
                <p className="text-slate-700">
                  {es
                    ? "Este plan no permite cambios de bolso adicionales durante el periodo mensual."
                    : "This plan does not allow additional bag changes during the monthly period."}
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-lg text-slate-900 mb-3">Privé (279 € / {es ? "mes" : "month"})</h4>
                <p className="text-slate-700 mb-2">
                  {es
                    ? "Acceso a un (1) bolso al mes de colecciones exclusivas, conforme a las condiciones del servicio."
                    : "Access to one (1) bag per month from exclusive collections, in accordance with the service conditions."}
                </p>
                <p className="text-slate-700">
                  {es
                    ? "Este plan no permite cambios de bolso adicionales durante el periodo mensual."
                    : "This plan does not allow additional bag changes during the monthly period."}
                </p>
              </div>
            </div>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "7.2 Condiciones de Facturación" : "7.2 Billing Conditions"}
            </h3>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              {es ? (
                <>
                  <li>Todos los precios incluyen IVA español (21%) según normativa vigente</li>
                  <li>La facturación es mensual y se cobra automáticamente el día de renovación</li>
                  <li>El primer cargo incluye el mes completo independientemente de la fecha de alta</li>
                  <li>No se realizan prorrateos por fracciones de mes</li>
                  <li>La Empresa se reserva el derecho de modificar precios con 30 días de antelación</li>
                  <li>En caso de cambio de plan, el nuevo precio aplicará en el siguiente ciclo de facturación</li>
                </>
              ) : (
                <>
                  <li>All prices include Spanish VAT (21%) in accordance with current regulations</li>
                  <li>Billing is monthly and charged automatically on the renewal date</li>
                  <li>The first charge covers the full month regardless of the sign-up date</li>
                  <li>No proration is applied for fractions of a month</li>
                  <li>The Company reserves the right to modify prices with 30 days' notice</li>
                  <li>In the event of a plan change, the new price will apply in the next billing cycle</li>
                </>
              )}
            </ul>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "8. Pagos, Verificación y Seguridad" : "8. Payments, Verification and Security"}
            </h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "8.1 Procesamiento de Pagos" : "8.1 Payment Processing"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "Todos los pagos se procesan de forma segura a través de Stripe, plataforma líder en procesamiento de pagos online. La clienta autoriza a SEMZO PRIVÉ a utilizar los métodos de pago registrados para gestionar cargos derivados de la membresía, pases de bolso adicionales e incidencias, conforme a estos Términos."
                : "All payments are processed securely through Stripe, the leading online payment processing platform. The member authorises SEMZO PRIVÉ to use the registered payment methods to manage charges arising from the membership, additional bag passes and incidents, in accordance with these Terms."}
            </p>
            <p className="text-slate-700 mb-4 p-4 rounded-lg border-l-4 border-slate-300">
              <strong>{es ? "Verificación de Seguridad:" : "Security Verification:"}</strong>{" "}
              {es
                ? "SEMZO PRIVÉ podrá realizar una preautorización reversible de 1€ como medida de verificación del método de pago y prevención de fraude. Este cargo temporal será devuelto automáticamente en un plazo de 3-5 días hábiles."
                : "SEMZO PRIVÉ may perform a reversible pre-authorisation of €1 as a payment method verification and fraud prevention measure. This temporary charge will be automatically returned within 3–5 business days."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "8.2 Mandato SEPA como mecanismo de respaldo" : "8.2 SEPA mandate as a backup mechanism"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "La clienta autoriza a SEMZO PRIVÉ a recopilar y conservar un mandato SEPA Direct Debit como medio de pago de respaldo, que podrá ser utilizado exclusivamente en caso de incidencias graves, tales como la no devolución, pérdida o daño grave del bolso alquilado."
                : "The member authorises SEMZO PRIVÉ to collect and retain a SEPA Direct Debit mandate as a backup payment method, which may be used exclusively in the event of serious incidents, such as non-return, loss or serious damage to the rented bag."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "Dicho mandato no se empleará para pagos recurrentes ni cargos ordinarios, y solo se ejecutará tras el envío de los avisos correspondientes conforme al protocolo establecido."
                : "This mandate will not be used for recurring payments or ordinary charges, and will only be executed after the corresponding notices have been sent in accordance with the established protocol."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "8.3 Verificación de Identidad Obligatoria" : "8.3 Mandatory Identity Verification"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es ? (
                <>
                  Para garantizar la seguridad de nuestro servicio y proteger nuestros activos de alto valor,{" "}
                  <strong>todos los usuarios deben completar un proceso de verificación de identidad obligatorio</strong>{" "}
                  mediante Stripe Identity antes de poder activar su membresía.
                </>
              ) : (
                <>
                  To ensure the security of our service and protect our high-value assets,{" "}
                  <strong>all users must complete a mandatory identity verification process</strong>{" "}
                  via Stripe Identity before activating their membership.
                </>
              )}
            </p>

            <h4 className="font-semibold text-slate-800 mt-4 mb-2">
              {es ? "Documentación Requerida:" : "Required Documentation:"}
            </h4>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              {es ? (
                <>
                  <li>DNI, NIE o Pasaporte vigente (ciudadanos españoles o residentes en España)</li>
                  <li>Pasaporte vigente (ciudadanos de la Unión Europea)</li>
                  <li>Selfie en vivo para validación biométrica</li>
                  <li>Comprobante de domicilio (recibo de servicios, contrato de alquiler, extracto bancario) con antigüedad máxima de 3 meses</li>
                </>
              ) : (
                <>
                  <li>Valid DNI, NIE or Passport (Spanish citizens or residents in Spain)</li>
                  <li>Valid Passport (European Union citizens)</li>
                  <li>Live selfie for biometric validation</li>
                  <li>Proof of address (utility bill, rental contract, bank statement) no older than 3 months</li>
                </>
              )}
            </ul>

            <h4 className="font-semibold text-slate-800 mt-4 mb-2">
              {es ? "Proceso de Verificación:" : "Verification Process:"}
            </h4>
            <p className="text-slate-700 mb-4">
              {es
                ? "La verificación es procesada por Stripe Identity, plataforma líder en verificación de identidad. El proceso típicamente toma entre 5 minutos y 24 horas. La Empresa se reserva el derecho de solicitar documentación adicional, rechazar solicitudes o suspender cuentas que presenten documentación fraudulenta."
                : "Verification is processed by Stripe Identity, the leading identity verification platform. The process typically takes between 5 minutes and 24 hours. The Company reserves the right to request additional documentation, reject applications or suspend accounts that present fraudulent documentation."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "9. Responsabilidades del Usuario" : "9. User Responsibilities"}
            </h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "9.1 Cuidado de los Artículos" : "9.1 Care of Articles"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es ? "El Usuario se compromete a:" : "The User undertakes to:"}
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              {es ? (
                <>
                  <li>Tratar cada artículo con el máximo cuidado y responsabilidad</li>
                  <li>Utilizar los artículos exclusivamente para uso personal y privado</li>
                  <li>Almacenar los artículos en condiciones adecuadas (temperatura ambiente, alejado de humedad)</li>
                  <li>Evitar exposición a líquidos, perfumes, cosméticos o productos químicos</li>
                  <li>No realizar modificaciones, reparaciones o alteraciones de ningún tipo</li>
                  <li>Reportar cualquier daño, pérdida o robo en un plazo máximo de 24 horas</li>
                </>
              ) : (
                <>
                  <li>Treat each article with the utmost care and responsibility</li>
                  <li>Use articles exclusively for personal and private use</li>
                  <li>Store articles under appropriate conditions (room temperature, away from moisture)</li>
                  <li>Avoid exposure to liquids, perfumes, cosmetics or chemical products</li>
                  <li>Not carry out any modifications, repairs or alterations of any kind</li>
                  <li>Report any damage, loss or theft within a maximum of 24 hours</li>
                </>
              )}
            </ul>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "9.2 Prohibiciones Expresas" : "9.2 Express Prohibitions"}
            </h3>
            <p className="text-slate-700 mb-4 p-4 rounded-lg border-l-4 border-slate-400">
              <strong>{es ? "Declaración Importante:" : "Important Statement:"}</strong>{" "}
              {es ? <>Queda <strong>estrictamente prohibido</strong>:</> : <>The following is <strong>strictly prohibited</strong>:</>}
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 p-4 rounded-lg border-l-4 border-slate-400">
              {es ? (
                <>
                  <li><strong>Subarrendar, prestar o ceder</strong> los artículos a terceros bajo ninguna circunstancia</li>
                  <li>Utilizar los artículos con fines comerciales, publicitarios o promocionales sin autorización escrita</li>
                  <li>Modificar, desmontar o alterar los artículos de cualquier forma</li>
                  <li>Vender, pignorar o gravar de cualquier modo los artículos</li>
                  <li>Utilizar los artículos en actividades ilegales o que puedan dañar la reputación de la Empresa o las marcas</li>
                  <li>Registrar una cuenta con datos falsos o suplantando la identidad de terceros</li>
                </>
              ) : (
                <>
                  <li><strong>Subleasing, lending or assigning</strong> articles to third parties under any circumstances</li>
                  <li>Using articles for commercial, advertising or promotional purposes without written authorisation</li>
                  <li>Modifying, dismantling or altering articles in any way</li>
                  <li>Selling, pledging or encumbering articles in any way</li>
                  <li>Using articles in illegal activities or activities that may damage the Company's or the brands' reputation</li>
                  <li>Registering an account with false data or impersonating third parties</li>
                </>
              )}
            </ul>
            <p className="text-slate-700 mt-4 font-semibold">
              {es
                ? "El incumplimiento de cualquiera de estas prohibiciones conllevará la cancelación inmediata del servicio y potenciales acciones legales."
                : "Breach of any of these prohibitions will result in immediate cancellation of the service and potential legal action."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "9.3 Periodo de Responsabilidad del Artículo" : "9.3 Period of Responsibility for the Article"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "La responsabilidad sobre el bolso alquilado se transfiere a la clienta desde el momento en que la entrega queda confirmada por el transportista (firma, confirmación electrónica o registro de seguimiento), y se mantiene hasta la recogida efectiva del artículo por la empresa de mensajería designada por SEMZO PRIVÉ."
                : "Responsibility for the rented bag is transferred to the member from the moment delivery is confirmed by the carrier (signature, electronic confirmation or tracking record), and is maintained until the article is effectively collected by the courier company designated by SEMZO PRIVÉ."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "Durante dicho periodo, cualquier daño, pérdida, no devolución o incidencia será imputable a la clienta, conforme a los presentes Términos y Condiciones."
                : "During this period, any damage, loss, non-return or incident shall be attributable to the member, in accordance with these Terms and Conditions."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "10. Daños, Pérdidas y Responsabilidad Económica" : "10. Damage, Loss and Financial Liability"}
            </h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "10.1 Inspección de Artículos" : "10.1 Inspection of Articles"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es ? (
                <>
                  Todos los artículos son inspeccionados meticulosamente antes del envío y documentados fotográficamente. El Usuario dispone de <strong>48 horas</strong> desde la recepción para reportar cualquier daño preexistente. Transcurrido este plazo, se asumirá que el artículo fue recibido en perfecto estado.
                </>
              ) : (
                <>
                  All articles are meticulously inspected before dispatch and photographically documented. The User has <strong>48 hours</strong> from receipt to report any pre-existing damage. After this period, it will be assumed that the article was received in perfect condition.
                </>
              )}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "10.2 Responsabilidad Económica por Categoría" : "10.2 Financial Liability by Category"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "En caso de incidencia grave (daño mayor, pérdida, robo o no devolución), la clienta podrá ser responsable económicamente hasta el valor máximo correspondiente a la categoría del bolso utilizado:"
                : "In the event of a serious incident (major damage, loss, theft or non-return), the member may be financially liable up to the maximum value corresponding to the category of the bag used:"}
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
              <li><strong>L'Essentiel:</strong> {es ? "hasta" : "up to"} 1.000€</li>
              <li><strong>Signature:</strong> {es ? "hasta" : "up to"} 2.500€</li>
              <li><strong>Privé:</strong> {es ? "hasta" : "up to"} 4.500€</li>
            </ul>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "10.3 Robo o Pérdida del Artículo" : "10.3 Theft or Loss of the Article"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "En caso de robo o pérdida del bolso durante el periodo de alquiler, la clienta deberá interponer denuncia ante la autoridad competente y remitir a SEMZO PRIVÉ una copia de la misma en un plazo máximo de cuarenta y ocho (48) horas desde que tenga conocimiento del hecho."
                : "In the event of theft or loss of the bag during the rental period, the member must file a report with the competent authority and send SEMZO PRIVÉ a copy within a maximum of forty-eight (48) hours from becoming aware of the event."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "La falta de presentación de dicha denuncia dentro del plazo indicado será considerada una incidencia grave a todos los efectos."
                : "Failure to file such a report within the stated period will be considered a serious incident for all purposes."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "10.4 Sustitución o Manipulación del Artículo" : "10.4 Substitution or Manipulation of the Article"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "La devolución de un artículo distinto al entregado, la devolución de un bolso falsificado, o cualquier manipulación sustancial del artículo (incluida la alteración de elementos identificativos) será considerada una incidencia grave equiparable a la no devolución del bolso, facultando a SEMZO PRIVÉ para aplicar los cargos correspondientes y ejercer las acciones legales oportunas."
                : "The return of an article other than the one delivered, the return of a counterfeit bag, or any substantial manipulation of the article (including alteration of identifying elements) will be considered a serious incident equivalent to non-return of the bag, entitling SEMZO PRIVÉ to apply the corresponding charges and take appropriate legal action."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "10.5 Clasificación de Daños" : "10.5 Damage Classification"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "El desgaste normal por uso adecuado está permitido. Sin embargo, cualquier daño, incidencia o anomalía deberá comunicarse de inmediato al equipo de SEMZO PRIVÉ."
                : "Normal wear from appropriate use is permitted. However, any damage, incident or anomaly must be reported immediately to the SEMZO PRIVÉ team."}
            </p>
            <div className="space-y-4 mb-4">
              <div className="p-4 rounded-lg border-l-4 border-slate-300">
                <p className="font-semibold text-slate-900 mb-2">
                  {es ? "Desgaste Normal (sin cargo):" : "Normal Wear (no charge):"}
                </p>
                <p className="text-slate-700 text-sm">
                  {es
                    ? "Uso razonable que no afecta la funcionalidad ni apariencia general del artículo."
                    : "Reasonable use that does not affect the functionality or general appearance of the article."}
                </p>
              </div>
              <div className="p-4 rounded-lg border-l-4 border-slate-400">
                <p className="font-semibold text-slate-900 mb-2">
                  {es ? "Daño Menor (50€ - 300€):" : "Minor Damage (€50 - €300):"}
                </p>
                <p className="text-slate-700 text-sm">
                  {es
                    ? "Pequeños arañazos, manchas superficiales removibles, desgaste en esquinas, pequeñas marcas en hardware."
                    : "Small scratches, removable surface stains, corner wear, small marks on hardware."}
                </p>
              </div>
              <div className="p-4 rounded-lg border-l-4 border-slate-500">
                <p className="font-semibold text-slate-900 mb-2">
                  {es ? "Daño Mayor (300€ - Valor total):" : "Major Damage (€300 - Full value):"}
                </p>
                <p className="text-slate-700 text-sm">
                  {es
                    ? "Roturas de asas, manchas permanentes, daños en costuras, rasgaduras, quemaduras, daños estructurales irreparables."
                    : "Broken handles, permanent stains, seam damage, tears, burns, irreparable structural damage."}
                </p>
              </div>
              <div className="p-4 rounded-lg border-l-4 border-slate-700">
                <p className="font-semibold text-slate-900 mb-2">
                  {es ? "Pérdida o Robo (Valor de mercado completo):" : "Loss or Theft (Full market value):"}
                </p>
                <p className="text-slate-700 text-sm">
                  {es
                    ? "El Usuario deberá abonar el valor de mercado actual del artículo según tasación profesional."
                    : "The User must pay the current market value of the article according to a professional appraisal."}
                </p>
              </div>
            </div>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "10.6 Definición de Incidencia Grave" : "10.6 Definition of Serious Incident"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "A los efectos de los presentes Términos y Condiciones, se considerará incidencia grave cualquiera de las siguientes situaciones:"
                : "For the purposes of these Terms and Conditions, a serious incident shall include any of the following situations:"}
            </p>
            <ol className="list-[lower-alpha] pl-6 text-slate-700 space-y-2 mb-4">
              {es ? (
                <>
                  <li>No devolución del bolso dentro del plazo contractual.</li>
                  <li>Retraso prolongado en la devolución (superior a 15 días naturales).</li>
                  <li>Daño grave no atribuible al uso normal.</li>
                  <li>Pérdida o robo del artículo sin la correspondiente denuncia en el plazo establecido.</li>
                  <li>Sustitución, falsificación o manipulación del bolso.</li>
                </>
              ) : (
                <>
                  <li>Non-return of the bag within the contractual period.</li>
                  <li>Prolonged delay in return (more than 15 calendar days).</li>
                  <li>Serious damage not attributable to normal use.</li>
                  <li>Loss or theft of the article without the corresponding report within the stated period.</li>
                  <li>Substitution, counterfeiting or manipulation of the bag.</li>
                </>
              )}
            </ol>
            <p className="text-slate-700 mb-4">
              {es
                ? "Las incidencias graves facultan a SEMZO PRIVÉ para ejecutar los cargos correspondientes conforme a lo establecido en estos Términos, incluido el uso del mandato SEPA como mecanismo de respaldo."
                : "Serious incidents entitle SEMZO PRIVÉ to execute the corresponding charges as established in these Terms, including the use of the SEPA mandate as a backup mechanism."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "10.7 Procedimiento en Caso de Daño" : "10.7 Procedure in Case of Damage"}
            </h3>
            <ol className="list-decimal pl-6 text-slate-700 space-y-2">
              {es ? (
                <>
                  <li>El Usuario debe notificar el incidente inmediatamente (máximo 24h) a través del email info@semzoprive.com</li>
                  <li>Proporcionar fotografías detalladas del daño desde múltiples ángulos</li>
                  <li>Si aplica, presentar denuncia policial (en casos de robo) en un plazo de 48 horas</li>
                  <li>La Empresa evaluará el daño mediante expertos independientes</li>
                  <li>Se emitirá una factura de reparación o reposición según corresponda</li>
                  <li>El Usuario dispone de 15 días naturales para abonar el importe</li>
                  <li>El impago suspenderá automáticamente el servicio y podrá derivar en acciones legales</li>
                </>
              ) : (
                <>
                  <li>The User must notify the incident immediately (maximum 24h) via email at info@semzoprive.com</li>
                  <li>Provide detailed photographs of the damage from multiple angles</li>
                  <li>If applicable, file a police report (in cases of theft) within 48 hours</li>
                  <li>The Company will assess the damage through independent experts</li>
                  <li>A repair or replacement invoice will be issued as appropriate</li>
                  <li>The User has 15 calendar days to pay the amount</li>
                  <li>Non-payment will automatically suspend the service and may lead to legal action</li>
                </>
              )}
            </ol>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "11. Devoluciones y Retrasos" : "11. Returns and Delays"}
            </h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "11.1 Plazo de Devolución" : "11.1 Return Period"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "El bolso deberá devolverse en la fecha indicada según la membresía contratada (30 días naturales desde el envío para membresías mensuales)."
                : "The bag must be returned by the date indicated according to the contracted membership (30 calendar days from dispatch for monthly memberships)."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "11.2 Retrasos en la Devolución por Causa Imputable a la Clienta" : "11.2 Delays in Return Attributable to the Member"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "La no disponibilidad de la clienta para la recogida del bolso, la facilitación de datos incorrectos o incompletos, o el incumplimiento de los horarios acordados con la empresa de mensajería no eximirán de responsabilidad y podrán dar lugar a penalizaciones, cargos adicionales y, en su caso, a la calificación de incidencia grave conforme a estos Términos."
                : "The member's unavailability for bag collection, provision of incorrect or incomplete data, or failure to comply with agreed schedules with the courier company will not exempt from liability and may give rise to penalties, additional charges and, where applicable, classification as a serious incident in accordance with these Terms."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "11.3 Cargos por Retraso" : "11.3 Late Return Charges"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es ? (
                <>
                  Los retrasos en la devolución darán lugar a un cargo de{" "}
                  <strong>15€ por cada día natural de retraso</strong>, que se cargará automáticamente al método de pago registrado.
                </>
              ) : (
                <>
                  Late returns will incur a charge of{" "}
                  <strong>€15 per calendar day of delay</strong>, which will be automatically charged to the registered payment method.
                </>
              )}
            </p>
            <p className="text-slate-700 mb-4 p-4 rounded-lg border-l-4 border-slate-400">
              <strong>{es ? "Importante:" : "Important:"}</strong>{" "}
              {es
                ? "Los retrasos prolongados (superiores a 15 días) serán considerados incidencia grave y podrán resultar en la suspensión del servicio y responsabilidad económica por el valor total del artículo."
                : "Prolonged delays (more than 15 days) will be considered a serious incident and may result in suspension of the service and financial liability for the full value of the article."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "12. Comunicaciones y Avisos" : "12. Communications and Notices"}
            </h2>
            <p className="text-slate-700 mb-4">
              {es
                ? "Las comunicaciones oficiales entre SEMZO PRIVÉ y la clienta se realizarán exclusivamente a través de los siguientes canales válidos:"
                : "Official communications between SEMZO PRIVÉ and the member will be made exclusively through the following valid channels:"}
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
              {es ? (
                <>
                  <li>Correo electrónico registrado en la cuenta de la clienta</li>
                  <li>SMS al número de teléfono verificado durante el registro</li>
                  <li>Notificaciones dentro de la plataforma SEMZO PRIVÉ (panel de usuario)</li>
                  <li>Correo electrónico oficial: info@semzoprive.com</li>
                </>
              ) : (
                <>
                  <li>Email registered in the member's account</li>
                  <li>SMS to the phone number verified during registration</li>
                  <li>Notifications within the SEMZO PRIVÉ platform (user panel)</li>
                  <li>Official email: info@semzoprive.com</li>
                </>
              )}
            </ul>
            <p className="text-slate-700 mb-4">
              {es
                ? "Ninguna comunicación realizada por canales distintos a los indicados (redes sociales, mensajería instantánea no oficial, llamadas no verificadas, etc.) tendrá validez contractual ni podrá ser invocada por ninguna de las partes como medio de prueba a efectos de estos Términos."
                : "No communication made through channels other than those indicated (social media, unofficial instant messaging, unverified calls, etc.) will have contractual validity or may be invoked by either party as evidence for the purposes of these Terms."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "La clienta se compromete a mantener actualizados sus datos de contacto y a revisar regularmente sus comunicaciones. La falta de respuesta tras los avisos establecidos podrá habilitar la ejecución de las medidas previstas en estos Términos, incluyendo cargos por incidencias, suspensión del servicio o acciones legales."
                : "The member undertakes to keep their contact details up to date and to regularly review their communications. Failure to respond after the established notices may enable the execution of the measures provided for in these Terms, including incident charges, service suspension or legal action."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "13. Autenticidad, Propiedad Intelectual y Marcas" : "13. Authenticity, Intellectual Property and Brands"}
            </h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "13.1 Garantía de Autenticidad" : "13.1 Authenticity Guarantee"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es ? (
                <>
                  Todos los artículos disponibles en el catálogo de Semzo Privé son{" "}
                  <strong>100% auténticos y originales</strong>. Cada pieza:
                </>
              ) : (
                <>
                  All articles available in the Semzo Privé catalogue are{" "}
                  <strong>100% authentic and original</strong>. Each piece:
                </>
              )}
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              {es ? (
                <>
                  <li>Ha sido inspeccionada y autenticada por expertos certificados independientes</li>
                  <li>Cuenta con certificado de autenticidad disponible bajo solicitud</li>
                  <li>Está protegida por seguro de responsabilidad civil de la Empresa</li>
                  <li>Procede de canales oficiales, mercado secundario verificado o colecciones privadas autenticadas</li>
                </>
              ) : (
                <>
                  <li>Has been inspected and authenticated by independent certified experts</li>
                  <li>Has a certificate of authenticity available on request</li>
                  <li>Is covered by the Company's public liability insurance</li>
                  <li>Comes from official channels, verified secondary market or authenticated private collections</li>
                </>
              )}
            </ul>
            <p className="text-slate-700 mb-4">
              {es
                ? "En el improbable caso de que se detecte un artículo no auténtico, la Empresa procederá a su retirada inmediata y ofrecerá compensación completa al Usuario afectado."
                : "In the unlikely event that a non-authentic article is detected, the Company will proceed to its immediate withdrawal and offer full compensation to the affected User."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "13.2 Relación con las Marcas" : "13.2 Relationship with Brands"}
            </h3>
            <p className="text-slate-700 mb-4 bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
              <strong>{es ? "Declaración Importante:" : "Important Statement:"}</strong>{" "}
              {es ? (
                <>
                  Semzo Privé opera como un servicio independiente de alquiler de artículos de lujo en el mercado secundario.{" "}
                  <strong>NO somos distribuidores autorizados, representantes oficiales ni estamos afiliados comercialmente</strong>{" "}
                  con ninguna de las marcas cuyos productos ofrecemos en alquiler.
                </>
              ) : (
                <>
                  Semzo Privé operates as an independent luxury item rental service in the secondary market.{" "}
                  <strong>We are NOT authorised distributors, official representatives nor are we commercially affiliated</strong>{" "}
                  with any of the brands whose products we offer for rental.
                </>
              )}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "Las marcas mencionadas en nuestra plataforma (Chanel, Hermès, Louis Vuitton, Gucci, Prada, Dior, etc.) son:"
                : "The brands mentioned on our platform (Chanel, Hermès, Louis Vuitton, Gucci, Prada, Dior, etc.) are:"}
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              {es ? (
                <>
                  <li>Propiedad exclusiva de sus respectivos titulares registrados</li>
                  <li>Utilizadas únicamente con fines descriptivos para identificar los productos</li>
                  <li>Mencionadas bajo el principio de agotamiento del derecho de marca (primera venta legal)</li>
                  <li>No utilizadas de manera que sugiera patrocinio, aprobación o afiliación con dichas marcas</li>
                </>
              ) : (
                <>
                  <li>The exclusive property of their respective registered owners</li>
                  <li>Used solely for descriptive purposes to identify the products</li>
                  <li>Referenced under the principle of exhaustion of trade mark rights (first legal sale)</li>
                  <li>Not used in a way that suggests sponsorship, endorsement or affiliation with those brands</li>
                </>
              )}
            </ul>
            <p className="text-slate-700 mt-4">
              {es
                ? "Ninguna de las marcas mencionadas patrocina, avala, certifica o está afiliada de ninguna manera con Semzo Privé. Todas las marcas y logotipos pertenecen a sus respectivos propietarios."
                : "None of the brands mentioned sponsor, endorse, certify or are affiliated in any way with Semzo Privé. All brands and logos belong to their respective owners."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "13.3 Propiedad Intelectual de Semzo Privé" : "13.3 Intellectual Property of Semzo Privé"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "El contenido de este sitio web (diseño, textos, imágenes, logotipos, código fuente, base de datos) es propiedad exclusiva de Semzo Privé y está protegido por las leyes españolas y europeas de propiedad intelectual. Queda prohibida su reproducción, distribución o modificación sin autorización expresa por escrito."
                : "The content of this website (design, texts, images, logos, source code, database) is the exclusive property of Semzo Privé and is protected by Spanish and European intellectual property laws. Its reproduction, distribution or modification is prohibited without express written authorisation."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "14. Limitación de Responsabilidad" : "14. Limitation of Liability"}
            </h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "14.1 Objetos Personales" : "14.1 Personal Belongings"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "SEMZO PRIVÉ no se hace responsable de los objetos personales que la clienta pueda olvidar dentro del bolso alquilado una vez realizada su devolución. La recuperación de dichos objetos, en caso de ser posible, no está garantizada."
                : "SEMZO PRIVÉ is not responsible for any personal items the member may leave inside the rented bag once it has been returned. Recovery of such items, if possible, is not guaranteed."}
            </p>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "14.2 Limitaciones Generales" : "14.2 General Limitations"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "En la máxima medida permitida por la legislación española aplicable, SEMZO PRIVÉ no será responsable de daños indirectos, incidentales, especiales o consecuentes que puedan derivarse del uso del servicio, incluyendo, a título meramente enunciativo, la pérdida de oportunidades, el lucro cesante o daños reputacionales, siempre que dichos daños no sean consecuencia de una actuación dolosa o gravemente negligente por parte de SEMZO PRIVÉ."
                : "To the maximum extent permitted by applicable Spanish law, SEMZO PRIVÉ shall not be liable for indirect, incidental, special or consequential damages arising from use of the service, including but not limited to loss of opportunity, loss of profits or reputational damage, provided that such damages are not the result of wilful misconduct or gross negligence on the part of SEMZO PRIVÉ."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "SEMZO PRIVÉ no garantiza la disponibilidad ininterrumpida del servicio, ni la disponibilidad permanente de artículos específicos del catálogo, dado que la prestación del servicio depende, entre otros factores, de la rotación de inventario, la logística y la demanda existente en cada momento."
                : "SEMZO PRIVÉ does not guarantee the uninterrupted availability of the service, nor the permanent availability of specific catalogue articles, given that the provision of the service depends, among other factors, on inventory rotation, logistics and current demand."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "Asimismo, SEMZO PRIVÉ no será responsable de retrasos en la entrega o recogida de los bolsos cuando dichos retrasos sean imputables a terceros ajenos a la Empresa, tales como empresas de transporte, operadores logísticos, autoridades aduaneras o supuestos de fuerza mayor, incluyendo, sin carácter limitativo, huelgas, condiciones meteorológicas adversas, incidencias técnicas o restricciones administrativas."
                : "Likewise, SEMZO PRIVÉ shall not be liable for delays in the delivery or collection of bags where such delays are attributable to third parties unrelated to the Company, such as transport companies, logistics operators, customs authorities or cases of force majeure, including but not limited to strikes, adverse weather conditions, technical incidents or administrative restrictions."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "La responsabilidad total y acumulada de SEMZO PRIVÉ frente a la clienta, por cualquier reclamación derivada del uso del servicio, quedará en todo caso limitada al importe efectivamente abonado por la clienta en concepto de cuotas de suscripción durante los doce (12) meses inmediatamente anteriores al hecho que origine la reclamación."
                : "The total and cumulative liability of SEMZO PRIVÉ towards the member, for any claim arising from the use of the service, shall in all cases be limited to the amount effectively paid by the member as subscription fees during the twelve (12) months immediately preceding the event giving rise to the claim."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "Las limitaciones establecidas en la presente cláusula no serán de aplicación en los supuestos en que la legislación española prohíba expresamente dicha limitación, ni en los casos de dolo o negligencia grave imputables directamente a SEMZO PRIVÉ."
                : "The limitations set out in this clause shall not apply in cases where Spanish law expressly prohibits such limitation, nor in cases of wilful misconduct or gross negligence directly attributable to SEMZO PRIVÉ."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "15. Suspensión o Cancelación del Servicio" : "15. Suspension or Cancellation of the Service"}
            </h2>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "15.1 Cancelación por Parte del Usuario" : "15.1 Cancellation by the User"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es ? (
                <>
                  El Usuario puede cancelar su membresía en cualquier momento desde su panel de cuenta. La cancelación será efectiva al final del período de facturación actual.{" "}
                  <strong>No se realizan reembolsos proporcionales</strong> por días no utilizados dentro del mes ya pagado.
                </>
              ) : (
                <>
                  The User may cancel their membership at any time from their account panel. Cancellation will take effect at the end of the current billing period.{" "}
                  <strong>No proportional refunds</strong> are made for unused days within the already paid month.
                </>
              )}
            </p>
            <p className="text-slate-700 mb-4">
              {es ? "Para que la cancelación sea efectiva:" : "For the cancellation to be effective:"}
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              {es ? (
                <>
                  <li>Todos los artículos deben ser devueltos en perfecto estado</li>
                  <li>No debe haber cargos pendientes por daños o retrasos</li>
                </>
              ) : (
                <>
                  <li>All articles must be returned in perfect condition</li>
                  <li>There must be no outstanding charges for damage or delays</li>
                </>
              )}
            </ul>

            <h3 className="font-serif text-xl text-slate-800 mt-6 mb-3">
              {es ? "15.2 Suspensión o Cancelación por la Empresa" : "15.2 Suspension or Cancellation by the Company"}
            </h3>
            <p className="text-slate-700 mb-4">
              {es
                ? "SEMZO PRIVÉ podrá suspender o cancelar inmediatamente el acceso al servicio en caso de:"
                : "SEMZO PRIVÉ may immediately suspend or cancel access to the service in the event of:"}
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
              {es ? (
                <>
                  <li>Incumplimiento de estos Términos y Condiciones</li>
                  <li>Uso indebido del servicio o de los artículos</li>
                  <li>Riesgo para los activos de la empresa</li>
                  <li>Retraso prolongado en la devolución de artículos</li>
                  <li>Impago de cargos por daños o incidencias</li>
                  <li>Fraude o actividad sospechosa</li>
                </>
              ) : (
                <>
                  <li>Breach of these Terms and Conditions</li>
                  <li>Misuse of the service or articles</li>
                  <li>Risk to company assets</li>
                  <li>Prolonged delay in the return of articles</li>
                  <li>Non-payment of damage or incident charges</li>
                  <li>Fraud or suspicious activity</li>
                </>
              )}
            </ul>
            <p className="text-slate-700 mb-4">
              {es
                ? "La suspensión o cancelación no exime al usuario del pago de obligaciones pendientes, cargos por daños o devolución inmediata de artículos en su posesión."
                : "Suspension or cancellation does not exempt the user from paying outstanding obligations, damage charges or immediately returning articles in their possession."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "16. Modificaciones de los Términos" : "16. Amendments to the Terms"}
            </h2>
            <p className="text-slate-700 mb-4">
              {es
                ? "SEMZO PRIVÉ se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento, notificándolo con una antelación razonable de al menos 15 días naturales a las clientas activas mediante correo electrónico y publicación en la plataforma."
                : "SEMZO PRIVÉ reserves the right to modify these Terms and Conditions at any time, notifying active members with reasonable advance notice of at least 15 calendar days by email and publication on the platform."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "El uso continuado del servicio tras la entrada en vigor de las modificaciones constituirá la aceptación expresa de las nuevas condiciones. Si la clienta no está de acuerdo con las modificaciones, podrá cancelar su membresía sin penalización dentro del plazo de notificación."
                : "Continued use of the service after the amendments take effect will constitute express acceptance of the new terms. If the member does not agree with the amendments, they may cancel their membership without penalty within the notification period."}
            </p>

            <h2 className="font-serif text-2xl text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">
              {es ? "17. Legislación Aplicable y Jurisdicción" : "17. Applicable Law and Jurisdiction"}
            </h2>
            <p className="text-slate-700 mb-4">
              {es
                ? "Estos Términos y Condiciones se rigen por la legislación española vigente. Para la resolución de cualquier controversia derivada de la interpretación o ejecución de estos términos, las partes se someten expresamente a los juzgados y tribunales que correspondan conforme a derecho, renunciando a cualquier otro fuero que pudiera corresponderles."
                : "These Terms and Conditions are governed by current Spanish law. For the resolution of any dispute arising from the interpretation or execution of these terms, the parties expressly submit to the courts and tribunals that correspond in accordance with the law, waiving any other jurisdiction that may apply to them."}
            </p>
            <p className="text-slate-700 mb-4">
              {es
                ? "Sin perjuicio de lo anterior, si la clienta tiene la consideración de consumidora conforme a la normativa española y europea de protección de consumidores, podrá ejercer sus derechos ante los órganos de consumo competentes o a través de plataformas de resolución alternativa de litigios."
                : "Without prejudice to the above, if the member is considered a consumer under Spanish and European consumer protection regulations, they may exercise their rights before the competent consumer bodies or through alternative dispute resolution platforms."}
            </p>

            <div className="mt-12 pt-8 border-t-2 border-slate-200">
              <p className="text-sm text-slate-500">
                <strong>{es ? "Versión:" : "Version:"}</strong> 3.0
                <br />
                <strong>{es ? "Última actualización:" : "Last updated:"}</strong>{" "}
                {es ? "7 de febrero de 2026" : "7 February 2026"}
                <br />
                <strong>{es ? "Entrada en vigor:" : "Effective date:"}</strong>{" "}
                {es ? "7 de febrero de 2026" : "7 February 2026"}
              </p>
              <p className="text-xs text-slate-400 mt-4">
                {es
                  ? "Este documento ha sido redactado conforme a la legislación española vigente incluyendo el Código Civil, Código de Comercio, Ley General para la Defensa de los Consumidores y Usuarios, Reglamento General de Protección de Datos (RGPD) y Ley de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE)."
                  : "This document has been drafted in accordance with current Spanish law including the Civil Code, Commercial Code, General Law for the Defence of Consumers and Users, General Data Protection Regulation (GDPR) and Law on Information Society Services and Electronic Commerce (LSSI-CE)."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
