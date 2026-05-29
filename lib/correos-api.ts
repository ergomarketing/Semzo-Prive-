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

interface CorreosShipmentRequest {
  sender: CorreosParty
  recipient: CorreosParty
  weight: number // gramos
  length?: number // cm
  width?: number // cm
  height?: number // cm
  productCode: string
  reference?: string
  observations?: string
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
 * Mapea CorreosShipmentRequest al payload JSON que entiende el endpoint
 * preregister v1 de la API moderna de Correos. El proxy ya inyecta
 * contractNumber, clientNumber y labellerCode desde su .env.
 */
function buildPreregisterPayload(s: CorreosShipmentRequest) {
  const partyJSON = (p: CorreosParty) => ({
    name: p.firstName,
    surname: p.lastName1,
    secondSurname: p.lastName2 || undefined,
    fullName: [p.firstName, p.lastName1, p.lastName2].filter(Boolean).join(" "),
    identificationType: p.documentType || undefined,
    identification: p.documentNumber || undefined,
    address: {
      streetType: p.viaType,
      streetName: p.viaName,
      streetNumber: p.number || undefined,
      stairs: p.portal || undefined,
      floor: p.floor || undefined,
      door: p.door || undefined,
    },
    postalCode: p.postalCode,
    city: p.city,
    state: p.province,
    countryCode: p.country || "ES",
    phone: p.phone || undefined,
    email: p.email || undefined,
  })
return {
shippingRequest: {
senderInfo: partyJSON(s.sender),
receiverInfo: partyJSON(s.recipient),
shipmentInfo: {
productCode: s.productCode,
clientReference: s.reference || "",
packagesNumber: 1,
weight: s.weight,
dimensions:
s.length && s.width && s.height
? {
length: s.length,
width: s.width,
height: s.height,
}
: undefined,
observations: s.observations || undefined,
labelType: 2,
},
},
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

export { CorreosAPI }
export type { CorreosShipmentRequest, CorreosShipmentResponse, CorreosTrackingResponse }
