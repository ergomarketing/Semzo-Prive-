/**
 * Correos API Integration
 * API Documentation: https://www.correos.es/ss/Satellite/site/pagina-apis/sidioma=es_ES
 */

interface CorreosCredentials {
  clientId: string
  clientSecret: string
}

interface CorreosAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface CorreosShipmentRequest {
  senderName: string
  senderAddress: string
  senderCity: string
  senderPostalCode: string
  senderCountry: string
  recipientName: string
  recipientAddress: string
  recipientCity: string
  recipientPostalCode: string
  recipientCountry: string
  recipientPhone?: string
  recipientEmail?: string
  weight: number // in grams
  length?: number // in cm
  width?: number // in cm
  height?: number // in cm
  productCode: string // e.g., "S0148" for Paq Premium
  reference?: string
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

// Correos Product Codes
export const CORREOS_PRODUCTS = {
  PAQ_PREMIUM: "S0148", // Paq Premium (1-2 días)
  PAQ_ESTANDAR: "S0132", // Paq Estándar (3-5 días)
  PAQ_LIGERO: "S0235", // Paq Ligero
  CORREOS_EXPRESS: "P", // Correos Express
}

class CorreosAPI {
  private baseUrl = "https://preregistroenvios.correos.es/preregistroenvios"
  private authUrl = "https://api.correos.es/oauth2/token"
  private trackingUrl = "https://localizador.correos.es"
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(private credentials: CorreosCredentials) {}

  private async authenticate(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const response = await fetch(this.authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Correos authentication failed: ${error}`)
    }

    const data: CorreosAuthResponse = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000 // Refresh 1 minute before expiry

    return this.accessToken
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.authenticate()
      return { success: true, message: "Conexión exitosa con Correos API" }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error de conexión",
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

    const xmlResponse = await response.text()
    return this.parseShipmentResponse(xmlResponse)
  }

  async getLabel(shipmentId: string): Promise<Buffer> {
    const token = await this.authenticate()

    const response = await fetch(`${this.baseUrl}/etiqueta/${shipmentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get label: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  async trackShipment(trackingNumber: string): Promise<CorreosTrackingResponse> {
    const response = await fetch(
      `${this.trackingUrl}/canonico/eventos_envio_paq/${trackingNumber}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to track shipment: ${response.statusText}`)
    }

    return response.json()
  }

  async calculateRates(
    originPostalCode: string,
    destinationPostalCode: string,
    weight: number
  ): Promise<Array<{ product: string; price: number; deliveryDays: string }>> {
    // Correos rate calculation - simplified version
    // In production, this would call the actual Correos rate API
    const rates = [
      {
        product: "Paq Premium",
        code: CORREOS_PRODUCTS.PAQ_PREMIUM,
        price: this.calculatePrice(weight, "premium"),
        deliveryDays: "1-2 días",
      },
      {
        product: "Paq Estándar",
        code: CORREOS_PRODUCTS.PAQ_ESTANDAR,
        price: this.calculatePrice(weight, "standard"),
        deliveryDays: "3-5 días",
      },
    ]

    return rates
  }

  private calculatePrice(weight: number, type: "premium" | "standard"): number {
    // Simplified pricing based on weight (in grams)
    const basePrice = type === "premium" ? 6.5 : 4.5
    const weightKg = weight / 1000
    const additionalCost = Math.max(0, weightKg - 1) * 1.5
    return Math.round((basePrice + additionalCost) * 100) / 100
  }

  private buildShipmentXML(shipment: CorreosShipmentRequest): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<PreregistroEnvio xmlns="http://www.correos.es/preregistroenvios">
  <CodEtiquetador>SEMZOPRIVE</CodEtiquetador>
  <Care>000000</Care>
  <TotalBultos>1</TotalBultos>
  <ModDevEtworkariqueta>2</ModDevEtiqueta>
  <Remitente>
    <Nombre>${this.escapeXML(shipment.senderName)}</Nombre>
    <Direccion>${this.escapeXML(shipment.senderAddress)}</Direccion>
    <Localidad>${this.escapeXML(shipment.senderCity)}</Localidad>
    <CodPostal>${shipment.senderPostalCode}</CodPostal>
    <Pais>${shipment.senderCountry}</Pais>
  </Remitente>
  <Destinatario>
    <Nombre>${this.escapeXML(shipment.recipientName)}</Nombre>
    <Direccion>${this.escapeXML(shipment.recipientAddress)}</Direccion>
    <Localidad>${this.escapeXML(shipment.recipientCity)}</Localidad>
    <CodPostal>${shipment.recipientPostalCode}</CodPostal>
    <Pais>${shipment.recipientCountry}</Pais>
    ${shipment.recipientPhone ? `<Telefono>${shipment.recipientPhone}</Telefono>` : ""}
    ${shipment.recipientEmail ? `<Email>${shipment.recipientEmail}</Email>` : ""}
  </Destinatario>
  <Envio>
    <CodProducto>${shipment.productCode}</CodProducto>
    <ReferenciaCliente>${shipment.reference || ""}</ReferenciaCliente>
    <Pesos>
      <Peso>
        <TipoPeso>R</TipoPeso>
        <Valor>${shipment.weight}</Valor>
      </Peso>
    </Pesos>
    ${
      shipment.length && shipment.width && shipment.height
        ? `
    <Medidas>
      <Alto>${shipment.height}</Alto>
      <Largo>${shipment.length}</Largo>
      <Ancho>${shipment.width}</Ancho>
    </Medidas>`
        : ""
    }
  </Envio>
</PreregistroEnvio>`
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  private parseShipmentResponse(xml: string): CorreosShipmentResponse {
    // Simple XML parsing - in production use a proper XML parser
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
  // Get credentials from database
  const response = await fetch("/api/admin/logistics/correos/credentials")
  if (!response.ok) return null

  const data = await response.json()
  if (!data.clientId || !data.clientSecret) return null

  return new CorreosAPI({
    clientId: data.clientId,
    clientSecret: data.clientSecret,
  })
}

export { CorreosAPI }
export type { CorreosShipmentRequest, CorreosShipmentResponse, CorreosTrackingResponse }
