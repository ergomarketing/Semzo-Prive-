import { EmailLayout } from "../layout"
import { CtaButton, InfoBox, Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface SepaPreExecutionEmailProps {
  customerName: string
  bagName: string
  rentalEndDate: string
  amountDue: number
  reservationId: string
  termsUrl: string
  dashboardUrl: string
  locale?: Locale
}

/**
 * Aviso legal pre-ejecución de mandato SEPA. Email transaccional obligatorio,
 * enviado el día 8 tras el fin del alquiler si el bolso no ha sido devuelto.
 */
export default function SepaPreExecutionEmail({
  customerName,
  bagName,
  rentalEndDate,
  amountDue,
  reservationId,
  termsUrl,
  dashboardUrl,
  locale = "es",
}: SepaPreExecutionEmailProps) {
  const t = getMessages(locale)

  return (
    <EmailLayout locale={locale}>
      <Heading>{t.sepaPreExecution.heading}</Heading>
      <Paragraph>Estimada {customerName},</Paragraph>
      <Paragraph>
        Le informamos que el bolso <strong>{bagName}</strong> (reserva #{reservationId}) aún no ha sido devuelto, habiéndose superado el
        plazo de finalización del alquiler el día <strong>{rentalEndDate}</strong>.
      </Paragraph>
      <InfoBox accent="danger">
        <strong>Plazo máximo para resolución: 14 días naturales desde la recepción de este aviso</strong>
      </InfoBox>
      <Paragraph>Acciones requeridas:</Paragraph>
      <ol style={{ lineHeight: 1.8 }}>
        <li>Devolver el bolso inmediatamente siguiendo las instrucciones de envío</li>
        <li>
          Contactar con nuestro equipo en <a href="mailto:soporte@semzoprive.com">soporte@semzoprive.com</a>
        </li>
        <li>Regularizar el estado de la reserva antes del vencimiento del plazo</li>
      </ol>
      <InfoBox accent="warning">
        <strong>Consecuencias si no se resuelve en 14 días naturales:</strong>
        <br />
        Se procederá a ejecutar el mandato SEPA Direct Debit autorizado en el momento de la contratación, por un importe de{" "}
        <strong>{amountDue.toFixed(2)}€</strong>, correspondiente al valor real del bolso no devuelto, conforme a lo establecido en la
        cláusula 8.2 de nuestros Términos y Condiciones.
      </InfoBox>
      <p style={{ fontSize: 14, color: "#666" }}>
        Este aviso se emite en cumplimiento de la normativa europea SEPA (Reglamento UE 260/2012) y conforme a los{" "}
        <a href={termsUrl}>Términos y Condiciones</a> aceptados en el momento de la contratación.
      </p>
      <CtaButton label="Ver mi reserva" url={dashboardUrl} />
      <Paragraph>
        Quedamos a su disposición para cualquier aclaración.
        <br />
        Atentamente,
        <br />
        <strong>Equipo de Semzo Privé</strong>
      </Paragraph>
      <p style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
        Este es un email transaccional legal. Por favor no responda directamente a este correo.
      </p>
    </EmailLayout>
  )
}
