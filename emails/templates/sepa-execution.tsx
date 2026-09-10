import { EmailLayout } from "../layout"
import { InfoBox, Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface SepaExecutionEmailProps {
  customerName: string
  bagName: string
  amountCharged: number
  reservationId: string
  paymentIntentId: string
  termsUrl: string
  locale?: Locale
}

/** Confirmación legal de ejecución de un cargo SEPA Direct Debit por no devolución. */
export default function SepaExecutionEmail({
  customerName,
  bagName,
  amountCharged,
  reservationId,
  paymentIntentId,
  termsUrl,
  locale = "es",
}: SepaExecutionEmailProps) {
  const t = getMessages(locale)

  return (
    <EmailLayout locale={locale}>
      <Heading>{t.sepaExecution.heading}</Heading>
      <Paragraph>Estimada {customerName},</Paragraph>
      <Paragraph>
        Le confirmamos que, transcurrido el plazo de 14 días naturales desde el aviso previo enviado sin haberse producido la devolución
        del bolso <strong>{bagName}</strong> (reserva #{reservationId}), se ha ejecutado el mandato SEPA Direct Debit autorizado en el
        momento de la contratación.
      </Paragraph>
      <InfoBox accent="danger">
        <strong>Importe cargado: {amountCharged.toFixed(2)}€</strong>
        <br />
        <span style={{ fontSize: 13, color: "#666" }}>Referencia de pago: {paymentIntentId}</span>
      </InfoBox>
      <Paragraph>
        Este importe corresponde al valor real de reposición del artículo no devuelto, conforme a lo establecido en la cláusula 8.2 de
        nuestros <a href={termsUrl}>Términos y Condiciones</a> aceptados en el momento de la contratación.
      </Paragraph>
      <p style={{ fontSize: 14, color: "#666" }}>
        Si considera que este cargo se ha realizado por error o el bolso ya ha sido devuelto, contacte de inmediato con nuestro equipo en{" "}
        <a href="mailto:soporte@semzoprive.com">soporte@semzoprive.com</a>.
      </p>
      <Paragraph>
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
