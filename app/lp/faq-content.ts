// Preguntas frecuentes de las landings (/lp/*). Todas las respuestas salen de las
// preguntas frecuentes y condiciones reales de la web (app/support/faq-data.ts) y de
// lo confirmado por Erika; sin plazos de entrega. Si cambia la politica, cambiar aqui.

export interface LpFaqItem {
  question: string
  answer: string
}

export const commonFaqs: LpFaqItem[] = [
  {
    question: "¿Hay permanencia?",
    answer:
      "No. Puedes cancelar cuando quieras y conservas el acceso hasta el final del ciclo facturado.",
  },
  {
    question: "¿Cómo funciona la membresía?",
    answer:
      "Todas las membresías incluyen un bolso de lujo a la vez. Eliges un bolso de la colección, lo disfrutas durante el mes y lo cambias por otro en el siguiente ciclo.",
  },
  {
    question: "¿Cómo suma mi cuota hacia la compra?",
    answer:
      "Si te enamoras de un bolso, puedes pasar al Modo Colecciona desde tu panel. Las cuotas de alquiler que ya hayas pagado en tu membresía actual se suman como crédito de compra, y cada cuota nueva también, hasta el precio fijado del bolso. Para hacerlo tuyo finalizas la compra desde tu panel y pagas la diferencia. Si cancelas la membresía, el crédito acumulado se pierde: no es dinero ni es reembolsable.",
  },
  {
    question: "¿Los bolsos son auténticos?",
    answer:
      "Todos pasan por un proceso de autenticación de varias capas, realizado por nuestro equipo de expertos y por autenticadores externos. Para ciertos modelos podemos proporcionar un certificado de autenticidad de Entrupy a petición. Si un autenticador verificado demostrara que un bolso comprado no es auténtico, te reembolsamos el importe completo al devolverlo. SEMZO PRIVÉ no es vendedor autorizado de las marcas que ofrece.",
  },
  {
    question: "¿Qué pasa si el bolso se mancha o se daña?",
    answer:
      "En Modo Descubre tu cuota incluye cobertura por uso normal: pequeñas manchas, roces o arañazos los gestiona nuestro equipo. No cubre negligencia, pérdida, robo no denunciado ni daños graves por mal uso; en esos casos se aplica una política basada en el valor del bolso. En Modo Colecciona la custodia es tuya mientras el bolso esté reservado para ti.",
  },
  {
    question: "¿Cómo devuelvo el bolso?",
    answer:
      "Al finalizar el mes de membresía, con todos los elementos originales (dust bag, tarjetas de autenticidad, etc.) y la etiqueta de envío prepagada que recibes junto al bolso. Cuando lo recibimos lo revisamos y te lo confirmamos por correo.",
  },
  {
    question: "¿Tiene coste el envío?",
    answer:
      "No. El envío y la devolución son gratuitos e incluyen seguro y seguimiento. Cubrimos toda la España peninsular.",
  },
]

export const madridFaqs: LpFaqItem[] = [
  {
    question: "¿Hacéis entrega y recogida en Madrid?",
    answer: "Sí. Hacemos entrega y recogida en toda la Comunidad de Madrid.",
  },
  ...commonFaqs,
]
