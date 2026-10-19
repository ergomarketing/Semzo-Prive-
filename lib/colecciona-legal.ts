/**
 * Textos legales de Modo Colecciona, versionados en codigo.
 *
 * Fuente: "Contrato_Colecciona_SEMZO_v2.docx" y "Condiciones_Programa_Colecciona_v1.docx"
 * (Erika, 2026-10-18). Un mismo texto alimenta la pantalla de compra, el PDF archivado y la
 * copia exacta (text_snapshot) que se guarda en legal_acceptances: lo que la socia ve es lo
 * que firma. Para cambiar un texto: nueva version (v3...), nunca editar una version ya aceptada.
 */

export const COLECCIONA_CONTRACT_VERSION = "v2"
export const COLECCIONA_CONDITIONS_VERSION = "v1"
/** Entrada en vigor de las Condiciones v1 (publicacion). Ajustar al aprobarlas definitivamente. */
export const COLECCIONA_CONDITIONS_EFFECTIVE_DATE = "19 de octubre de 2026"

export const COLECCIONA_CONTRACT_DOCUMENT = "Contrato de compraventa Colecciona"
export const COLECCIONA_CONDITIONS_DOCUMENT = "Condiciones del Programa Colecciona"
export const COLECCIONA_ANNEX_DOCUMENT = "Anexo I — Estado del artículo (Colecciona)"

export const COLECCIONA_CONTEXT_CONTRACT = "colecciona_purchase"
export const COLECCIONA_CONTEXT_CONDITIONS = "colecciona_program_conditions"
export const COLECCIONA_CONTEXT_ANNEX = "colecciona_condition_annex"

/** Frase exacta de la casilla separada del Anexo I. */
export const COLECCIONA_ANNEX_PHRASE = "Acepto expresamente el estado del bolso descrito y fotografiado en el Anexo I."

/** Texto de las variables de las Condiciones v1 (aprobado por Erika, 2026-10-18). */
export const COLECCIONA_CREDIT_RULE =
  "Cada cuota de membresía y cada Pase de Bolso pagados con dinero generan crédito por su importe íntegro, IVA incluido. " +
  "Se incluyen las cuotas anteriores a la activación de Colecciona correspondientes a la membresía vigente. " +
  "El crédito empieza a acumularse desde la fecha en que la socia activa Colecciona para un bolso concreto. " +
  "Los pagos realizados con tarjetas regalo o cupones no generan crédito."
export const COLECCIONA_CREDIT_CAP = "el precio de venta del bolso"

/** Apartados del Anexo I (claves de bags.condition_report). */
export const CONDITION_REPORT_FIELDS = [
  { key: "exterior", label: "Exterior (piel / tejido)" },
  { key: "esquinas", label: "Esquinas y bordes" },
  { key: "asas", label: "Asas, cadena o correa" },
  { key: "herrajes", label: "Herrajes y cierre" },
  { key: "interior", label: "Interior y forro" },
  { key: "accesorios", label: "Accesorios incluidos" },
] as const

export type ConditionReportKey = (typeof CONDITION_REPORT_FIELDS)[number]["key"]
export type ConditionReport = Record<ConditionReportKey, string> & { updated_at?: string }

/** Devuelve la ficha limpia si los seis apartados estan rellenos; si no, null. */
export function parseCompleteConditionReport(raw: unknown): ConditionReport | null {
  if (!raw || typeof raw !== "object") return null
  const source = raw as Record<string, unknown>
  const report: Partial<ConditionReport> = {}
  for (const { key } of CONDITION_REPORT_FIELDS) {
    const value = typeof source[key] === "string" ? (source[key] as string).trim() : ""
    if (!value) return null
    report[key] = value
  }
  if (typeof source.updated_at === "string") report.updated_at = source.updated_at
  return report as ConditionReport
}

export interface ContractVars {
  nombre_completo_socia: string
  email_socia: string
  id_socia: string
  /** "NIE Y9167403P" / "DNI 12345678Z": identifica a la compradora. */
  documento_socia: string
  /** Direccion a la que se envio el bolso (la del envio; si no hay, la del perfil). */
  domicilio_envio: string
  marca: string
  modelo: string
  referencia_nfc: string
  precio_venta: string
  credito_aplicado: string
  importe_final: string
  version_condiciones_colecciona: string
  estado_exterior: string
  estado_esquinas: string
  estado_asas: string
  estado_herrajes: string
  estado_interior: string
  accesorios: string
  url_galeria_fotos: string
}

export interface AcceptanceStamp {
  fecha_hora_aceptacion: string
  ip_aceptacion: string
}

/** Bloques de documento: los usan la pantalla (HTML) y el generador de PDF. */
export type DocBlock =
  | { type: "title"; text: string }
  | { type: "subtitle"; text: string }
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string; lead?: string }
  | { type: "table"; rows: Array<[string, string]> }
  | { type: "note"; text: string }

/** Importe en formato espanol sin simbolo (la plantilla ya pone " €"). */
export function formatAmount(value: number): string {
  return new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

export function memberNumber(userId: string): string {
  return `SP-${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`
}

/** Contrato sin anexos (lo que se muestra en el cuerpo del contrato). */
export function buildContractMainBlocks(v: ContractVars, stamp?: AcceptanceStamp): DocBlock[] {
  const blocks: DocBlock[] = [
    { type: "title", text: "SEMZO PRIVÉ" },
    { type: "subtitle", text: "CONTRATO DE COMPRAVENTA DE ARTÍCULO DE SEGUNDA MANO · MODO COLECCIONA" },
    { type: "heading", text: "Partes" },
    {
      type: "paragraph",
      lead: "Vendedora:",
      text:
        "Erika González Ortiz, con NIE Y8738588M, con domicilio a efectos de notificaciones en calle Tales de Mileto 1, " +
        "Urbanización Banana Beach, bloque C3, piso 2 FW, 29603 Marbella (Málaga), que desarrolla su actividad como " +
        "profesional autónoma bajo la marca registrada SEMZO PRIVÉ (en adelante, “SEMZO PRIVÉ”). Contacto: info@semzoprive.com.",
    },
    {
      type: "paragraph",
      lead: "Compradora:",
      text:
        `${v.nombre_completo_socia}, con ${v.documento_socia || "el documento indicado en la factura"}, con domicilio de envío y notificaciones en ` +
        `${v.domicilio_envio || "la dirección registrada en su perfil de socia"}, ` +
        `con email ${v.email_socia} y número de socia ${v.id_socia} (en adelante, “la Compradora”), ` +
        "que actúa como persona consumidora.",
    },
    { type: "heading", text: "Cláusulas" },
    {
      type: "paragraph",
      lead: "1. Objeto y precio.",
      text: "SEMZO PRIVÉ vende a la Compradora el siguiente artículo:",
    },
    {
      type: "table",
      rows: [
        ["Marca y modelo", `${v.marca} · ${v.modelo}`],
        ["Referencia interna", v.referencia_nfc],
        ["Precio de venta (IVA incluido)", `${v.precio_venta} €`],
        ["Crédito Colecciona aplicado", `${v.credito_aplicado} €`],
        ["Importe final pagado (IVA incluido)", `${v.importe_final} €`],
      ],
    },
    {
      type: "paragraph",
      text: "La Compradora celebra esta compraventa de forma voluntaria: su membresía no incluía ninguna obligación de compra.",
    },
    {
      type: "paragraph",
      text:
        "El Crédito Colecciona es una bonificación que SEMZO PRIVÉ concede a la socia conforme a las Condiciones del " +
        `Programa Colecciona, versión ${v.version_condiciones_colecciona}, aceptadas por la Compradora y vigentes en la fecha ` +
        "de compra, y se aplica como descuento sobre el precio de venta en el momento de la compra. Su importe puede " +
        "calcularse por referencia a las cuotas de membresía abonadas, pero no constituye una devolución de esas cuotas, " +
        "que remuneraron el servicio de alquiler ya prestado, ni un pago a cuenta del precio. No es canjeable por dinero.",
    },
    {
      type: "paragraph",
      text:
        "Todos los importes incluyen el IVA del 21 %. La base imponible y la cuota de IVA de esta venta se calculan sobre " +
        "el importe final pagado, una vez aplicado el descuento, y figuran desglosadas en la factura, que SEMZO PRIVÉ emite " +
        "y envía a la Compradora con la confirmación del pago.",
    },
    {
      type: "paragraph",
      lead: "2. Naturaleza del artículo.",
      text:
        "El artículo es de segunda mano. Ha formado parte del servicio de alquiler por membresía de SEMZO PRIVÉ y puede " +
        "presentar marcas de uso propias de ese servicio.",
    },
    {
      type: "paragraph",
      lead: "3. Estado del artículo.",
      text:
        "Antes de comprar, SEMZO PRIVÉ ha informado a la Compradora del estado concreto del artículo mediante la descripción " +
        "y las fotografías del Anexo I. La Compradora lo ha tenido en su poder durante su membresía y declara conocer ese " +
        "estado. Mediante una aceptación expresa y separada de la aceptación de este contrato, la Compradora acepta las " +
        "características descritas en el Anexo I, que por ello no constituirán falta de conformidad.",
    },
    {
      type: "paragraph",
      lead: "4. Autenticidad.",
      text:
        "SEMZO PRIVÉ garantiza que el artículo es original y auténtico. Si se acreditase lo contrario, SEMZO PRIVÉ " +
        "reembolsará íntegramente el importe pagado y restituirá el Crédito Colecciona aplicado, sin límite temporal. " +
        "SEMZO PRIVÉ no está afiliada a las marcas cuyos artículos comercializa.",
    },
    {
      type: "paragraph",
      lead: "5. Derecho de desistimiento.",
      text:
        "La Compradora dispone de 14 días naturales desde la fecha de compra para desistir sin indicar motivo. Puede " +
        "comunicarlo a info@semzoprive.com o con el formulario del Anexo II. Deberá devolver el artículo, en el estado " +
        "descrito en el Anexo I, en un máximo de 14 días desde esa comunicación. Los costes de devolución corren a cargo " +
        "de la Compradora. SEMZO PRIVÉ reembolsará el importe pagado, por el mismo medio de pago, en un máximo de 14 días, " +
        "y restituirá el Crédito Colecciona aplicado. Podrá retener el reembolso hasta recibir el artículo. La Compradora " +
        "responde de la disminución de valor causada por un uso distinto del necesario para comprobar la naturaleza del " +
        "artículo, tomando como referencia el estado del Anexo I.",
    },
    {
      type: "paragraph",
      lead: "6. Garantía legal.",
      text:
        "Las partes pactan, como permite la ley para bienes de segunda mano, un plazo de garantía de 1 año desde la " +
        "entrega. Cubre las faltas de conformidad no descritas en el Anexo I que no se deban al uso posterior a la compra. " +
        "Por tratarse de una pieza única, los remedios serán la reparación, la rebaja del precio o la resolución del " +
        "contrato con reembolso del importe pagado y restitución del Crédito Colecciona aplicado. Para reclamar, la " +
        "Compradora puede escribir a info@semzoprive.com.",
    },
    {
      type: "paragraph",
      lead: "7. Entrega y transmisión de la propiedad.",
      text:
        "El artículo fue enviado a la Compradora a la dirección indicada en el apartado «Partes». Como ya está en su " +
        "poder, la entrega se entiende producida en la fecha de confirmación del pago. En ese momento pasan a la Compradora la propiedad y el riesgo, y el artículo deja de formar parte del " +
        "servicio de membresía.",
    },
    {
      type: "paragraph",
      lead: "8. Efectos sobre la membresía.",
      text:
        "La compra no modifica, suspende ni cancela la membresía de la Compradora, que continúa conforme a sus condiciones " +
        "generales. Desde la confirmación del pago, la Compradora podrá solicitar un nuevo bolso de su plan en las " +
        "condiciones habituales de la membresía.",
    },
    {
      type: "paragraph",
      lead: "9. Protección de datos.",
      text:
        "Responsable: Erika González Ortiz (SEMZO PRIVÉ). Los datos de la Compradora, incluidos la fecha, la hora y la IP " +
        "de aceptación, se tratan para gestionar esta compraventa y conservar la prueba de su aceptación, sobre la base de " +
        "la ejecución del contrato y el cumplimiento de obligaciones legales. Se conservan durante los plazos legales de " +
        "prescripción. Más información y ejercicio de derechos en la Política de Privacidad.",
    },
    {
      type: "paragraph",
      lead: "10. Aceptación y archivo.",
      text:
        "La Compradora acepta este contrato electrónicamente desde su área privada de socia. El contrato aceptado se envía " +
        "por email en PDF y queda archivado en esa área, accesible en cualquier momento. El contrato está redactado en español.",
    },
    {
      type: "paragraph",
      lead: "11. Reclamaciones.",
      text:
        "La Compradora puede dirigir sus quejas a info@semzoprive.com. SEMZO PRIVÉ no está adherida a ningún sistema de " +
        "arbitraje de consumo ni a otra entidad de resolución alternativa de litigios. La Compradora dispone de hojas de " +
        "quejas y reclamaciones a su disposición, que puede solicitar en la misma dirección.",
    },
    {
      type: "paragraph",
      lead: "12. Ley aplicable y jurisdicción.",
      text:
        "Este contrato se rige por la legislación española. Para cualquier controversia serán competentes los juzgados del " +
        "domicilio de la Compradora.",
    },
  ]

  if (stamp) {
    blocks.push({
      type: "note",
      text:
        `Aceptado electrónicamente por ${v.nombre_completo_socia} el ${stamp.fecha_hora_aceptacion}, desde la IP ` +
        `${stamp.ip_aceptacion}. Versión del contrato: ${COLECCIONA_CONTRACT_VERSION}.`,
    })
  }

  return blocks
}

/** Documento completo: contrato + Anexo I + Anexo II (el que se archiva en PDF). */
export function buildContractBlocks(v: ContractVars, stamp?: AcceptanceStamp): DocBlock[] {
  return [...buildContractMainBlocks(v, stamp), ...buildAnnexBlocks(v), ...buildWithdrawalFormBlocks()]
}

/** Anexo I: se muestra aparte en la pantalla de compra (aceptacion separada) y dentro del PDF. */
export function buildAnnexBlocks(v: ContractVars): DocBlock[] {
  return [
    { type: "heading", text: "Anexo I · Estado del artículo" },
    {
      type: "paragraph",
      text: `Descripción del estado del artículo ${v.marca} · ${v.modelo} (${v.referencia_nfc}), con sus marcas de uso visibles.`,
    },
    {
      type: "table",
      rows: [
        ["Exterior (piel / tejido)", v.estado_exterior],
        ["Esquinas y bordes", v.estado_esquinas],
        ["Asas, cadena o correa", v.estado_asas],
        ["Herrajes y cierre", v.estado_herrajes],
        ["Interior y forro", v.estado_interior],
        ["Accesorios incluidos", v.accesorios],
        ["Fotografías", v.url_galeria_fotos],
      ],
    },
    { type: "note", text: `Aceptación expresa y separada: “${COLECCIONA_ANNEX_PHRASE}”` },
  ]
}

export function buildWithdrawalFormBlocks(): DocBlock[] {
  return [
    { type: "heading", text: "Anexo II · Formulario de desistimiento" },
    { type: "note", text: "(Solo debe cumplimentar y enviar el presente formulario si desea desistir del contrato.)" },
    {
      type: "paragraph",
      text:
        "A la atención de Erika González Ortiz (SEMZO PRIVÉ), calle Tales de Mileto 1, Urbanización Banana Beach, " +
        "bloque C3, piso 2 FW, 29603 Marbella (Málaga). Email: info@semzoprive.com.",
    },
    {
      type: "paragraph",
      text:
        "Por la presente le comunico que desisto de mi contrato de compraventa del siguiente bien: " +
        "____________________________ (marca, modelo y referencia).",
    },
    { type: "paragraph", text: "Comprado el: ______________" },
    { type: "paragraph", text: "Nombre de la consumidora: ____________________________" },
    { type: "paragraph", text: "Domicilio de la consumidora: ____________________________" },
    { type: "paragraph", text: "Firma de la consumidora (solo si el formulario se presenta en papel): ______________" },
    { type: "paragraph", text: "Fecha: ______________" },
  ]
}

export function buildConditionsBlocks(): DocBlock[] {
  return [
    { type: "title", text: "SEMZO PRIVÉ" },
    { type: "subtitle", text: "CONDICIONES DEL PROGRAMA COLECCIONA" },
    {
      type: "note",
      text: `Versión ${COLECCIONA_CONDITIONS_VERSION} · En vigor desde el ${COLECCIONA_CONDITIONS_EFFECTIVE_DATE}`,
    },
    {
      type: "paragraph",
      text:
        "Estas condiciones regulan el programa Colecciona de SEMZO PRIVÉ, marca registrada bajo la que desarrolla su " +
        "actividad Erika González Ortiz, con NIE Y8738588M y domicilio en calle Tales de Mileto 1, Urbanización Banana " +
        "Beach, bloque C3, piso 2 FW, 29603 Marbella (Málaga). Forman parte de las condiciones generales de la membresía " +
        "y la socia las acepta al darse de alta.",
    },
    { type: "heading", text: "1. Qué es Colecciona" },
    {
      type: "paragraph",
      text:
        "Colecciona permite a las socias comprar, si así lo desean, bolsos de la colección de SEMZO PRIVÉ que ya conocen " +
        "porque los tienen o los han tenido en su poder durante su membresía. SEMZO PRIVÉ decide qué bolsos están " +
        "disponibles en Colecciona en cada momento.",
    },
    { type: "heading", text: "2. Carácter voluntario y naturaleza de las cuotas" },
    {
      type: "paragraph",
      text:
        "La membresía es un servicio de acceso temporal a bolsos de lujo. No incluye ninguna obligación de compra ni " +
        "ningún derecho automático a adquirir los bolsos, y la compra nunca se produce por el mero transcurso del tiempo " +
        "ni por alcanzar un determinado importe de cuotas.",
    },
    {
      type: "paragraph",
      text:
        "Cada cuota de membresía remunera exclusivamente el servicio prestado en su periodo y se factura como tal, con su " +
        "IVA. Las cuotas no son pagos a cuenta del precio de ningún bolso ni se devuelven, total o parcialmente, en caso " +
        "de compra.",
    },
    { type: "heading", text: "3. Quién puede comprar" },
    {
      type: "paragraph",
      text:
        "Pueden comprar en Colecciona las socias con membresía activa y al corriente de pago, y únicamente los bolsos " +
        "marcados como disponibles en Colecciona que tengan o hayan tenido en su poder durante su membresía.",
    },
    { type: "heading", text: "4. Precio Colecciona" },
    {
      type: "paragraph",
      text:
        "Cada bolso disponible en Colecciona tiene un precio de venta fijado y publicado por SEMZO PRIVÉ antes de la " +
        "compra, con el IVA incluido. SEMZO PRIVÉ puede actualizar ese precio para compras futuras; el precio aplicable " +
        "es el publicado en el momento de aceptar el contrato de compraventa.",
    },
    { type: "heading", text: "5. Crédito Colecciona" },
    {
      type: "paragraph",
      text:
        "El Crédito Colecciona es una bonificación por fidelidad que SEMZO PRIVÉ concede a sus socias y que se aplica como " +
        "descuento sobre el precio Colecciona en el momento de la compra. Se aplica el mismo criterio a todas las socias.",
    },
    { type: "paragraph", lead: "Cálculo.", text: COLECCIONA_CREDIT_RULE },
    {
      type: "paragraph",
      lead: "Límite.",
      text: `El crédito aplicado en una compra no puede superar ${COLECCIONA_CREDIT_CAP}.`,
    },
    {
      type: "paragraph",
      text:
        "Su importe puede calcularse por referencia a las cuotas abonadas, pero no constituye una devolución de esas " +
        "cuotas ni un saldo a favor de la socia. Solo puede usarse como descuento en una compra Colecciona: no es " +
        "canjeable por dinero, no es transferible a otra persona, no se reembolsa y se pierde si la socia causa baja en " +
        "la membresía.",
    },
    { type: "paragraph", text: "La socia puede consultar en su área privada el crédito disponible en cada momento." },
    { type: "heading", text: "6. Cómo se compra" },
    {
      type: "paragraph",
      text:
        "Antes de pagar, la socia ve el precio Colecciona, el crédito aplicable y el importe final, y acepta el contrato " +
        "de compraventa y, de forma expresa y separada, el estado del bolso descrito y fotografiado en el Anexo I de ese " +
        "contrato. Sin ambas aceptaciones no es posible completar el pago.",
    },
    { type: "heading", text: "7. Factura e IVA" },
    {
      type: "paragraph",
      text:
        "SEMZO PRIVÉ emite una factura por cada compra, en la que figuran el precio Colecciona, el Crédito Colecciona " +
        "como descuento en línea separada, la base imponible, el IVA aplicable y el importe final pagado. El IVA de la " +
        "compraventa se calcula sobre el importe final pagado, una vez aplicado el descuento.",
    },
    { type: "heading", text: "8. Desistimiento y garantía" },
    {
      type: "paragraph",
      text:
        "La socia conserva el derecho a desistir de la compra en 14 días naturales y la garantía legal de 1 año, en los " +
        "términos del contrato de compraventa. Si desiste, o si se resuelve el contrato por falta de conformidad, se le " +
        "reembolsa el importe pagado y se le restituye el Crédito Colecciona aplicado.",
    },
    { type: "heading", text: "9. Efecto sobre la membresía" },
    {
      type: "paragraph",
      text:
        "La compra no modifica, suspende ni cancela la membresía, que continúa conforme a sus condiciones generales. " +
        "Desde la confirmación del pago, la socia puede solicitar un nuevo bolso de su plan en las condiciones habituales.",
    },
    { type: "heading", text: "10. Modificación de estas condiciones" },
    {
      type: "paragraph",
      text:
        "SEMZO PRIVÉ puede modificar estas condiciones por motivos justificados, comunicándolo a las socias por email con " +
        "al menos un mes de antelación. Las modificaciones se aplican a partir de su entrada en vigor y no reducen el " +
        "crédito ya generado hasta esa fecha. La socia que no esté de acuerdo puede darse de baja de la membresía antes " +
        "de su entrada en vigor.",
    },
    { type: "heading", text: "11. Contacto y ley aplicable" },
    {
      type: "paragraph",
      text:
        "Para cualquier consulta sobre Colecciona, la socia puede escribir a info@semzoprive.com. Estas condiciones se " +
        "rigen por la legislación española.",
    },
  ]
}

/** Texto plano de un documento (para text_snapshot en legal_acceptances). */
export function blocksToPlainText(blocks: DocBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
          return block.lead ? `${block.lead} ${block.text}` : block.text
        case "table":
          return block.rows.map(([label, value]) => `${label}: ${value}`).join("\n")
        default:
          return block.text
      }
    })
    .join("\n\n")
}
