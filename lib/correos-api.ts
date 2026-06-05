/**
 * Correos API Integration via Semzo Proxy
 *
 * Toda la comunicacion con Correos pasa por el proxy desplegado en VPS Nominalia
 * (correos.semzoprive.com), que es el unico que tiene la IP autorizada por Correos.
 *
 * Variables de entorno requeridas:
 *   CORREOS_PROXY_URL       (ej: https://correos.semzoprive.com)
 *   CORREOS_PROXY_API_KEY   (la PROXY_API_KEY definida en el .env del VPS)
 *
 * IMPORTANTE: cualquier dato que llegue aqui debe haber pasado por sanitizeRecipient()
 * en lib/correos-sanitize.ts. Esta capa SOLO orquesta llamadas al proxy.
 */

export interface CorreosParty {
  firstName: string
  lastName1: string
  lastName2?: string
  documentType?: "DNI" | "NIE" | "PASAPORTE" | "CIF"
  documentNumber?: string
  viaType: string
  viaName: string
  number?: string
  portal?: string
  floor?: string
  door?: string
  postalCode: string
  city: string
  province: string
  country: string
  phone?: string
  email?: string
}

/**
 * Tipo de envio segun el contrato PTRES de Correos:
 *  - "outbound"   : ida (Semzo -> cliente)
 *  - "return"     : devolucion independiente (cliente -> Semzo)
 *  - "round_trip" : ida que ademas prepara la etiqueta de retorno
 *                   (activa prepareReturnShippingIndicator = "Y" en el paquete)
 */
type CorreosShipmentMode = "outbound" | "return" | "round_trip"

interface CorreosShipmentRequest {
  sender: CorreosParty
  recipient: CorreosParty
  weight: number // gramos
  length?: number // cm
  width?: number // cm
  height?: number // cm
  productCode: string
  reference?: string
  reference2?: string
  reference3?: string
  observations?: string
  /** Por defecto "outbound". Define el comportamiento de retorno PTRES. */
  mode?: CorreosShipmentMode
  /** Metodo de entrega Correos (ej "DOUAOF" domicilio). Por defecto "DOUAOF". */
  deliveryMethod?: string
  /** Provincia de admision (codigo Correos). Por defecto la del remitente. */
  admissionProvince?: string
  /** Metodo de admision Correos. Por defecto 1. */
  admissionMethod?: number
}

/* ===========================================================================
 * Modelo PTRES PRE oficial de Correos
 * Estructura del endpoint /admissions/preregister/api/v1/delivery
 * Referencia: coleccion oficial "PRUEBAS PTRES PRE".
 * =========================================================================== */

/** Remitente / destinatario en formato PTRES (sender / addressee). */
interface PtresParty {
  // --- Identidad (remitente o destinatario) ---
  name: string
  lastName1?: string
  lastName2?: string
  doiType?: string // tipo documento Correos (1 = NIF/DNI por defecto)
  doiNumber?: string
  company?: string
  contactPerson?: string
  // --- Direccion (remitente o destinatario) ---
  addressType?: string // tipo de via Correos (ej "CL", "AV")
  address: string
  number?: string
  portal?: string
  block?: string
  staircase?: string
  floor?: string
  door?: string
  addressComplement?: string
  locality: string
  province: string
  cp: string
  zip?: string
  country: string
  // --- Contacto (remitente o destinatario) ---
  contactPhone?: string
  email?: string
  smsNumber?: string
  language?: string
  chosenOffice?: string
  homepaqCode?: string
}

/** Contenido aduanero / datos del paquete PTRES (campos oficiales). */
interface PtresPackageContents {
  shipmentType: string
  instructionsDoNotDeliver?: string
  customsData?: unknown[]
}

/** Paquete individual PTRES. */
interface PtresPackage {
  packageId: string // contenido / descripcion del paquete
  packageWeightGrams: string
  packageHeight: string
  packageWidth: string
  packageLength: string
  cubicMeters?: string
  clientReference?: string // referencia cliente
  clientReference2?: string
  clientReference3?: string
  observations?: string
  packingIndicator?: string
  /** "Y" para preparar la etiqueta de retorno (ida y vuelta). */
  prepareReturnShippingIndicator?: string
  packageContents: PtresPackageContents
}

/** Envio PTRES: combina datos de contrato, paquetes, remitente y destinatario. */
interface PtresShipment {
  // --- Datos de contrato Correos ---
  // Credenciales de contrato: OPCIONALES en la app.
  // Las inyecta el proxy de Correos (VPS) desde su .env antes del envio final.
  // La app NUNCA las lee de variables de entorno de Vercel.
  contractNumber?: string
  clientNumber?: string
  labellerCode?: string
  // --- Datos del envio ---
  admissionProvince?: string
  packagesNumber: string
  product: string
  admissionMethod?: number
  deliveryMethod: string
  manifestCode?: string
  totalWeight: string
  totalLength?: string
  totalWidth?: string
  totalHigh?: string
  totalCubicMeters?: string
  shipmentReference1?: string
  shipmentReference2?: string
  shipmentReference3?: string
  shipmentNotes?: string
  dateExpiry?: string
  modificationType?: string
  // --- Paquete(s) ---
  packages: PtresPackage[]
  // --- Destinatario ---
  addressee: PtresParty
  // --- Remitente ---
  sender: PtresParty
}

/** Payload raiz PTRES enviado al endpoint preregister. */
interface PtresPreregisterPayload {
  errorCodeLanguage: string
  shipments: PtresShipment[]
}

interface CorreosShipmentResponse {
  codEnvio: string
  codEtiquetador: string
  fechaRespuesta?: string
  resultado?: string
  idEnvio?: string
  datosResultado?: string
  raw?: any
}

interface CorreosTrackingResponse {
  eventos: Array<{
    fecha: string
    hora: string
    descripcion: string
    localidad: string
  }>
  fechaEntrega?: string
  estadoEnvio: string
}

// Codigos de producto Correos (API moderna)
export const CORREOS_PRODUCTS = {
  PAQ_PREMIUM: "S0148",
  PAQ_ESTANDAR: "S0132",
  PAQ_LIGERO: "S0235",
  CORREOS_EXPRESS: "P",
}

function getProxyConfig() {
  const url = process.env.CORREOS_PROXY_URL
  const key = process.env.CORREOS_PROXY_API_KEY
  if (!url || !key) {
    throw new Error(
      "Correos proxy no configurado: faltan CORREOS_PROXY_URL o CORREOS_PROXY_API_KEY",
    )
  }
  return { url: url.replace(/\/$/, ""), key }
}

async function proxyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { url, key } = getProxyConfig()
  const headers = new Headers(init.headers)
  headers.set("x-api-key", key)
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  return fetch(`${url}${path}`, { ...init, headers })
}

/**
 * Mapea el tipo de documento interno al codigo doiType de Correos.
 * Por defecto "1" (NIF/DNI), que es el usado en los ejemplos oficiales PTRES.
 */
function mapDoiType(documentType?: CorreosParty["documentType"]): string {
  switch (documentType) {
    case "CIF":
      return "2"
    case "NIE":
      return "3"
    case "PASAPORTE":
      return "4"
    case "DNI":
    default:
      return "1"
  }
}

/**
 * Convierte una CorreosParty interna en el objeto PTRES (sender / addressee).
 * Conserva nombre, apellidos, documento, direccion completa, telefono y email.
 */
function toPtresParty(p: CorreosParty): PtresParty {
  // Orden y campos identicos al ejemplo oficial PTRES (sender / addressee).
  // Los campos sin dato se envian como "" para igualar la estructura oficial.
  return {
    // Identidad
    name: p.firstName,
    lastName1: p.lastName1 || "",
    lastName2: p.lastName2 || "",
    doiType: p.documentNumber ? mapDoiType(p.documentType) : "1",
    doiNumber: p.documentNumber || "",
    company: "",
    contactPerson: "",
    // Direccion
    addressType: p.viaType || "",
    address: p.viaName,
    number: p.number || "",
    portal: p.portal || "",
    block: "",
    staircase: "",
    floor: p.floor || "",
    door: p.door || "",
    addressComplement: "",
    locality: p.city,
    province: p.province,
    cp: p.postalCode,
    zip: "",
    country: p.country || "ESP",
    // Contacto
    contactPhone: p.phone || "",
    email: p.email || "",
    smsNumber: "",
    language: "spa",
    chosenOffice: "",
    homepaqCode: "",
  }
}

/**
 * Construye UN objeto shipment en formato PTRES oficial de Correos.
 * Implementacion nueva (no reutiliza el modelo shippingRequests anterior).
 *
 * Soporta:
 *  - ida ("outbound")
 *  - devolucion ("return")
 *  - ida y vuelta ("round_trip") -> prepareReturnShippingIndicator = "Y"
 */
function buildPtresShipmentPayload(s: CorreosShipmentRequest): PtresShipment {
  const mode: CorreosShipmentMode = s.mode || "outbound"
  const weightGrams = String(s.weight)

  // Paquete en orden y con campos identicos al ejemplo oficial PTRES.
  const pkg: PtresPackage = {
    packageId: s.observations || s.reference || "Paquete",
    packageWeightGrams: weightGrams,
    packageHeight: s.height != null ? String(s.height) : "",
    packageWidth: s.width != null ? String(s.width) : "",
    packageLength: s.length != null ? String(s.length) : "",
    cubicMeters: "",
    clientReference: s.reference || "",
    clientReference2: s.reference2 || "",
    clientReference3: s.reference3 || "",
    observations: s.observations || "",
    packingIndicator: "",
    // Ida y vuelta: "Y" prepara la etiqueta de retorno (premium domicilio).
    prepareReturnShippingIndicator: mode === "round_trip" ? "Y" : "",
    packageContents: {
      shipmentType: "2",
      instructionsDoNotDeliver: "",
      customsData: [],
    },
  }

  return {
    // NOTA: contractNumber / clientNumber / labellerCode se omiten a proposito.
    // El proxy de Correos (VPS) los inyecta desde su .env antes del envio final.
    // Datos del envio (orden identico al ejemplo oficial).
    admissionProvince: s.admissionProvince || s.sender.province || "",
    packagesNumber: "1",
    product: s.productCode,
    admissionMethod: s.admissionMethod ?? 1,
    deliveryMethod: s.deliveryMethod || "DOUAOF",
    manifestCode: "",
    totalWeight: weightGrams,
    totalLength: "",
    totalWidth: "",
    totalHigh: "",
    totalCubicMeters: "",
    shipmentReference1: s.reference || "",
    shipmentReference2: s.reference2 || "",
    shipmentReference3: s.reference3 || "",
    shipmentNotes: "",
    dateExpiry: "",
    modificationType: "1",
    // Paquete
    packages: [pkg],
    // Destinatario
    addressee: toPtresParty(s.recipient),
    // Remitente
    sender: toPtresParty(s.sender),
  }
}

/**
 * Envuelve uno o varios shipments en el payload raiz PTRES que espera el
 * endpoint preregister v1 de Correos.
 */
function buildPreregisterPayload(s: CorreosShipmentRequest): PtresPreregisterPayload {
  const payload: PtresPreregisterPayload = {
    errorCodeLanguage: "spa",
    shipments: [buildPtresShipmentPayload(s)],
  }

  // Log del JSON final para comparar visualmente con la coleccion oficial de Correos.
  // (contractNumber/clientNumber/labellerCode los inyecta el proxy, por eso no aparecen aqui)
  console.log("[v0] PTRES payload final ->\n" + JSON.stringify(payload, null, 2))

  return payload
}

class CorreosAPI {
  // El constructor mantiene la firma anterior por compatibilidad con los
  // callers existentes, pero las credenciales ya NO se usan aqui: el proxy
  // gestiona el OAuth con sus propias credenciales.
  constructor(_credentials?: { clientId?: string; clientSecret?: string; codEtiquetador?: string }) {}

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await proxyFetch("/api/correos/auth-test", { method: "GET" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        return {
          success: false,
          message: `Proxy respondio ${res.status}: ${JSON.stringify(data)}`,
        }
      }
      return { success: true, message: "Conexion OK con Correos via proxy" }
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : "Error de conexion con el proxy",
      }
    }
  }

  async createShipment(shipment: CorreosShipmentRequest): Promise<CorreosShipmentResponse> {
    const payload = buildPreregisterPayload(shipment)
    const res = await proxyFetch("/api/correos/preregister", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(
        `Correos preregister fallo (${res.status}): ${JSON.stringify(data)}`,
      )
    }
    // Normalizar respuesta. La API moderna devuelve estructura distinta a la antigua;
    // intentamos detectar el codigo de envio en los nombres mas comunes.
    const codEnvio =
      data.shippingCode ||
      data.codEnvio ||
      data.shipmentCode ||
      data.code ||
      data?.preregistros?.[0]?.codEnvio ||
      data?.preregistros?.[0]?.shippingCode ||
      ""
    return {
      codEnvio,
      codEtiquetador: data.labellerCode || data.codEtiquetador || "",
      fechaRespuesta: data.responseDate || data.fechaRespuesta,
      resultado: data.result || data.resultado,
      idEnvio: data.shipmentId || data.idEnvio,
      datosResultado: data.resultData || data.datosResultado,
      raw: data,
    }
  }

  async getLabel(shipmentId: string): Promise<Buffer> {
    const res = await proxyFetch("/api/correos/label", {
      method: "POST",
      body: JSON.stringify({ shippingCodes: [shipmentId], labelFormat: "PDF" }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      throw new Error(`Correos label fallo (${res.status}): ${errText}`)
    }
    const data = await res.json().catch(() => null)
    // El endpoint moderno devuelve el PDF en base64 dentro del JSON.
    const b64: string | undefined =
      data?.label || data?.labels?.[0]?.label || data?.labels?.[0]?.content || data?.content
    if (!b64) {
      throw new Error("Correos label: no se encontro el PDF en la respuesta del proxy")
    }
    return Buffer.from(b64, "base64")
  }

  async trackShipment(_trackingNumber: string): Promise<CorreosTrackingResponse> {
    // El proxy aun no expone tracking. Cuando lo anadamos, llamara aqui.
    throw new Error(
      "Tracking via proxy aun no implementado. Anadir endpoint /api/correos/track al proxy.",
    )
  }

  async calculateRates(
    _originPostalCode: string,
    _destinationPostalCode: string,
    weight: number,
  ): Promise<Array<{ product: string; code: string; price: number; deliveryDays: string }>> {
    return [
      {
        product: "Paq Premium",
        code: CORREOS_PRODUCTS.PAQ_PREMIUM,
        price: this.calculatePrice(weight, "premium"),
        deliveryDays: "1-2 dias",
      },
      {
        product: "Paq Estandar",
        code: CORREOS_PRODUCTS.PAQ_ESTANDAR,
        price: this.calculatePrice(weight, "standard"),
        deliveryDays: "3-5 dias",
      },
    ]
  }

  private calculatePrice(weight: number, type: "premium" | "standard"): number {
    const basePrice = type === "premium" ? 6.5 : 4.5
    const weightKg = weight / 1000
    const additionalCost = Math.max(0, weightKg - 1) * 1.5
    return Math.round((basePrice + additionalCost) * 100) / 100
  }
}

export async function getCorreosClient(): Promise<CorreosAPI | null> {
  // Ya no hace falta cargar credenciales remotas: el proxy las gestiona.
  return new CorreosAPI()
}
export { CorreosAPI, buildPtresShipmentPayload, buildPreregisterPayload }
export type {
  CorreosShipmentRequest,
  CorreosShipmentResponse,
  CorreosTrackingResponse,
  CorreosShipmentMode,
  PtresParty,
  PtresPackage,
  PtresShipment,
  PtresPreregisterPayload,
}
