/**
 * Correos API Integration
 * API Documentation: https://www.correos.es/ss/Satellite/site/pagina-apis/sidioma=es_ES
 *
 * IMPORTANTE: cualquier dato que llegue aqui debe haber pasado por sanitizeRecipient()
 * en lib/correos-sanitize.ts. Esta capa SOLO construye el XML, NO valida ni normaliza.
 */

interface CorreosCredentials {
  clientId: string
  clientSecret: string
  codEtiquetador?: string
}

interface CorreosAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

/**
 * Datos del remitente (almacen Semzo). Se obtienen de logistics_settings o de
 * variables hardcodeadas como fallback. Estructurado igual que el destinatario.
 */
export interface CorreosParty {
  // Identificacion
  firstName: string
  lastName1: string
  lastName2?: string
  documentType?: "DNI" | "NIE" | "PASAPORTE" | "CIF"
  documentNumber?: string

  // Direccion estructurada
  viaType: string // codigo Correos 2 letras (CL, AV, PZ, ...)
  viaName: string
  number?: string
  portal?: string
  floor?: string
  door?: string

  // Localizacion
  postalCode: string
  city: string
  province: string
  country: string // ES por defecto

  // Contacto
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
  productCode: string // ej: "S0132" Paq Estandar
  reference?: string // referencia cliente, normalmente el ID de reserva
  observations?: string // texto opcional impreso en la etiqueta
}

interface CorreosShipmentResponse {
  codEnvio: string
  codEtiquetador: string
  fechaRespuesta: string
  resultado: string
  idEnvio?: string
  datosResultado?: string
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

// Codigos de producto Correos
export const CORREOS_PRODUCTS = {
  PAQ_PREMIUM: "S0148", // Paq Premium (1-2 dias)
  PAQ_ESTANDAR: "S0132", // Paq Estandar (3-5 dias)
  PAQ_LIGERO: "S0235", // Paq Ligero
  CORREOS_EXPRESS: "P", // Correos Express
}

class CorreosAPI {
  private baseUrl = "https://preregistroenvios.correos.es/preregistroenvios"
  private authUrl = "https://api.correos.es/oauth2/token"
  private trackingUrl = "https://localizador.correos.es"
  private accessToken: string | null = null
  private tokenExpiry = 0

  constructor(
    private credentials: CorreosCredentials,
    private codEtiquetador: string = "SEMZOPRIVE",
  ) {}

  private async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    console.log("[v0][correos] auth POST ->", this.authUrl)

    let response: Response
    try {
      response = await fetch(this.authUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
        }),
      })
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
      console.error("[v0][correos] auth fetch threw:", msg)
      throw new Error(`Correos auth network error (${this.authUrl}): ${msg}`)
    }

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0][correos] auth response not ok", response.status, error)
      throw new Error(`Correos authentication failed (${response.status}): ${error}`)
    }

    const data: CorreosAuthResponse = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return this.accessToken
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.authenticate()
      return { success: true, message: "Conexion exitosa con Correos API" }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error de conexion",
      }
    }
  }

  async createShipment(shipment: CorreosShipmentRequest): Promise<CorreosShipmentResponse> {
    const token = await this.authenticate()
    const xmlBody = this.buildShipmentXML(shipment)

    const response = await fetch(`${this.baseUrl}/preregistro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        Authorization: `Bearer ${token}`,
      },
      body: xmlBody,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create shipment: ${error}`)
    }

    return this.parseShipmentResponse(await response.text())
  }

  async getLabel(shipmentId: string): Promise<Buffer> {
    const token = await this.authenticate()
    const response = await fetch(`${this.baseUrl}/etiqueta/${shipmentId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" },
    })

    if (!response.ok) {
      throw new Error(`Failed to get label: ${response.statusText}`)
    }

    return Buffer.from(await response.arrayBuffer())
  }

  async trackShipment(trackingNumber: string): Promise<CorreosTrackingResponse> {
    const response = await fetch(
      `${this.trackingUrl}/canonico/eventos_envio_paq/${trackingNumber}`,
      { method: "GET", headers: { Accept: "application/json" } },
    )

    if (!response.ok) {
      throw new Error(`Failed to track shipment: ${response.statusText}`)
    }

    return response.json()
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

  /**
   * Construye XML segun especificacion Correos PreRegistroEnvios.
   * Direccion estructurada con TipoVia, NombreVia, NumeroVia, Escalera, Planta, Puerta.
   */
  private buildShipmentXML(s: CorreosShipmentRequest): string {
    const fullName = (p: CorreosParty) =>
      [p.firstName, p.lastName1, p.lastName2].filter(Boolean).join(" ")

    const partyXML = (p: CorreosParty, role: "Remitente" | "Destinatario") => {
      const docXML =
        p.documentType && p.documentNumber
          ? `
    <TipoDocumento>${this.escapeXML(p.documentType)}</TipoDocumento>
    <NumeroDocumento>${this.escapeXML(p.documentNumber)}</NumeroDocumento>`
          : ""

      return `
  <${role}>
    <Nombre>${this.escapeXML(p.firstName)}</Nombre>
    <Apellido1>${this.escapeXML(p.lastName1)}</Apellido1>${
      p.lastName2 ? `\n    <Apellido2>${this.escapeXML(p.lastName2)}</Apellido2>` : ""
    }
    <NombreCompleto>${this.escapeXML(fullName(p))}</NombreCompleto>${docXML}
    <Direccion>
      <TipoVia>${this.escapeXML(p.viaType)}</TipoVia>
      <NombreVia>${this.escapeXML(p.viaName)}</NombreVia>${
        p.number ? `\n      <NumeroVia>${this.escapeXML(p.number)}</NumeroVia>` : ""
      }${p.portal ? `\n      <Portal>${this.escapeXML(p.portal)}</Portal>` : ""}${
        p.floor ? `\n      <Planta>${this.escapeXML(p.floor)}</Planta>` : ""
      }${p.door ? `\n      <Puerta>${this.escapeXML(p.door)}</Puerta>` : ""}
    </Direccion>
    <CodPostal>${p.postalCode}</CodPostal>
    <Localidad>${this.escapeXML(p.city)}</Localidad>
    <Provincia>${this.escapeXML(p.province)}</Provincia>
    <Pais>${this.escapeXML(p.country || "ES")}</Pais>${
      p.phone ? `\n    <Telefono>${this.escapeXML(p.phone)}</Telefono>` : ""
    }${p.email ? `\n    <Email>${this.escapeXML(p.email)}</Email>` : ""}
  </${role}>`
    }

    const dimensions =
      s.length && s.width && s.height
        ? `
    <Medidas>
      <Alto>${s.height}</Alto>
      <Largo>${s.length}</Largo>
      <Ancho>${s.width}</Ancho>
    </Medidas>`
        : ""

    const observations = s.observations
      ? `\n    <Observaciones>${this.escapeXML(s.observations)}</Observaciones>`
      : ""

    return `<?xml version="1.0" encoding="UTF-8"?>
<PreregistroEnvio xmlns="http://www.correos.es/preregistroenvios">
  <CodEtiquetador>${this.escapeXML(this.codEtiquetador)}</CodEtiquetador>
  <Care>000000</Care>
  <TotalBultos>1</TotalBultos>
  <ModDevEtiqueta>2</ModDevEtiqueta>${partyXML(s.sender, "Remitente")}${partyXML(s.recipient, "Destinatario")}
  <Envio>
    <CodProducto>${s.productCode}</CodProducto>
    <ReferenciaCliente>${this.escapeXML(s.reference || "")}</ReferenciaCliente>
    <Pesos>
      <Peso>
        <TipoPeso>R</TipoPeso>
        <Valor>${s.weight}</Valor>
      </Peso>
    </Pesos>${dimensions}${observations}
  </Envio>
</PreregistroEnvio>`
  }

  private escapeXML(str: string): string {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  private parseShipmentResponse(xml: string): CorreosShipmentResponse {
    const getTagContent = (tag: string) => {
      const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return match ? match[1] : ""
    }

    return {
      codEnvio: getTagContent("CodEnvio"),
      codEtiquetador: getTagContent("CodEtiquetador"),
      fechaRespuesta: getTagContent("FechaRespuesta"),
      resultado: getTagContent("Resultado"),
      idEnvio: getTagContent("IdEnvio"),
      datosResultado: getTagContent("DatosResultado"),
    }
  }
}

export async function getCorreosClient(): Promise<CorreosAPI | null> {
  const response = await fetch("/api/admin/logistics/correos/credentials")
  if (!response.ok) return null

  const data = await response.json()
  if (!data.clientId || !data.clientSecret) return null

  return new CorreosAPI(
    { clientId: data.clientId, clientSecret: data.clientSecret },
    data.codEtiquetador || "SEMZOPRIVE",
  )
}

export { CorreosAPI }
export type { CorreosShipmentRequest, CorreosShipmentResponse, CorreosTrackingResponse }
