/**
 * Sanitizador centralizado para datos enviados a la API de Correos.
 *
 * Correos exige:
 * - Texto en mayúsculas, sin tildes ni eñes (ASCII).
 * - Longitudes maximas estrictas por campo.
 * - Telefono: 9 digitos sin prefijo internacional.
 * - CP: 5 digitos exactos.
 * - Documento: DNI/NIE/Pasaporte con formato valido.
 *
 * Mantener la sanitizacion centralizada aqui evita inconsistencias
 * entre formulario, admin y XML de Correos.
 */

// Limites maximos por campo segun spec Correos
export const CORREOS_MAX_LENGTHS = {
  firstName: 30,
  lastName: 30,
  documentNumber: 14,
  viaType: 5,
  viaName: 50,
  number: 5,
  portal: 10,
  floor: 10,
  door: 10,
  city: 50,
  province: 50,
  postalCode: 5,
  phone: 15,
  email: 50,
  observations: 200,
} as const

const TIPO_VIA_VALIDOS = [
  "CL", // Calle
  "AV", // Avenida
  "PZ", // Plaza
  "PS", // Paseo
  "CM", // Camino
  "CR", // Carretera
  "TR", // Travesia
  "RD", // Ronda
  "GL", // Glorieta
  "BL", // Bulevar
  "UR", // Urbanizacion
  "OT", // Otro
] as const

export type TipoVia = (typeof TIPO_VIA_VALIDOS)[number]

export type DocumentType = "DNI" | "NIE" | "PASAPORTE"

/**
 * Quita tildes y caracteres no ASCII. Convierte n con tilde a N normal.
 * Correos rechaza caracteres no ASCII en muchos campos.
 */
export function removeAccents(input: string): string {
  if (!input) return ""
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita diacriticos
    .replace(/Ñ/g, "N")
    .replace(/ñ/g, "n")
}

/**
 * Normaliza texto: trim, uppercase, sin tildes, colapsa espacios.
 */
export function normalizeText(input: string | null | undefined, maxLength?: number): string {
  if (!input) return ""
  let result = removeAccents(input.trim().toUpperCase())
  result = result.replace(/\s+/g, " ")
  // Solo permite letras, digitos, espacios y caracteres basicos seguros
  result = result.replace(/[^A-Z0-9\s.,\-/'°ºªN]/g, "")
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength).trim()
  }
  return result
}

/**
 * Normaliza telefono espanol: quita prefijo +34, espacios, guiones.
 * Devuelve 9 digitos o cadena vacia si invalido.
 */
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return ""
  let phone = input.replace(/[\s\-().]/g, "")
  // Quita prefijos +34, 0034, 34
  phone = phone.replace(/^(\+34|0034|34)/, "")
  // Solo digitos
  phone = phone.replace(/\D/g, "")
  // Validar 9 digitos empezando por 6,7,8,9
  if (!/^[6789]\d{8}$/.test(phone)) return ""
  return phone
}

/**
 * Normaliza codigo postal espanol: 5 digitos exactos con padding.
 */
export function normalizePostalCode(input: string | null | undefined): string {
  if (!input) return ""
  const cp = input.replace(/\D/g, "")
  if (cp.length === 0 || cp.length > 5) return ""
  return cp.padStart(5, "0")
}

/**
 * Valida y normaliza DNI espanol: 8 digitos + letra mayuscula.
 */
export function normalizeDNI(input: string): string {
  const clean = input.replace(/[\s\-]/g, "").toUpperCase()
  if (!/^\d{8}[A-Z]$/.test(clean)) return ""
  // Validacion letra de control
  const letras = "TRWAGMYFPDXBNJZSQVHLCKE"
  const numero = parseInt(clean.substring(0, 8), 10)
  const letraEsperada = letras[numero % 23]
  if (clean[8] !== letraEsperada) return ""
  return clean
}

/**
 * Valida y normaliza NIE: X/Y/Z + 7 digitos + letra.
 */
export function normalizeNIE(input: string): string {
  const clean = input.replace(/[\s\-]/g, "").toUpperCase()
  if (!/^[XYZ]\d{7}[A-Z]$/.test(clean)) return ""
  const letras = "TRWAGMYFPDXBNJZSQVHLCKE"
  const prefijo = clean[0] === "X" ? "0" : clean[0] === "Y" ? "1" : "2"
  const numero = parseInt(prefijo + clean.substring(1, 8), 10)
  const letraEsperada = letras[numero % 23]
  if (clean[8] !== letraEsperada) return ""
  return clean
}

/**
 * Valida pasaporte: alfanumerico 5-14 caracteres.
 */
export function normalizePassport(input: string): string {
  const clean = input.replace(/[\s\-]/g, "").toUpperCase()
  if (!/^[A-Z0-9]{5,14}$/.test(clean)) return ""
  return clean
}

/**
 * Normaliza documento segun tipo. Devuelve cadena vacia si invalido.
 */
export function normalizeDocument(type: DocumentType, value: string | null | undefined): string {
  if (!value) return ""
  switch (type) {
    case "DNI":
      return normalizeDNI(value)
    case "NIE":
      return normalizeNIE(value)
    case "PASAPORTE":
      return normalizePassport(value)
    default:
      return ""
  }
}

/**
 * Mapea valores libres de tipo de via a codigo Correos.
 */
export function normalizeViaType(input: string | null | undefined): TipoVia {
  if (!input) return "CL"
  const upper = removeAccents(input.trim().toUpperCase())
  const map: Record<string, TipoVia> = {
    CALLE: "CL",
    "C/": "CL",
    C: "CL",
    AVENIDA: "AV",
    AVDA: "AV",
    AVD: "AV",
    PLAZA: "PZ",
    PZA: "PZ",
    PASEO: "PS",
    CAMINO: "CM",
    CARRETERA: "CR",
    CTRA: "CR",
    TRAVESIA: "TR",
    RONDA: "RD",
    GLORIETA: "GL",
    BULEVAR: "BL",
    URBANIZACION: "UR",
    URB: "UR",
  }
  if (map[upper]) return map[upper]
  if (TIPO_VIA_VALIDOS.includes(upper as TipoVia)) return upper as TipoVia
  return "OT"
}

/**
 * Normaliza email: trim + lowercase. Valida formato basico.
 */
export function normalizeEmail(input: string | null | undefined): string {
  if (!input) return ""
  const email = input.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ""
  if (email.length > CORREOS_MAX_LENGTHS.email) return ""
  return email
}

/**
 * Sanitiza un destinatario completo para envio a Correos.
 * Devuelve objeto limpio + array de errores de validacion.
 */
export interface RawRecipient {
  firstName: string
  lastName1: string
  lastName2?: string | null
  documentType: DocumentType
  documentNumber: string
  viaType: string
  viaName: string
  number?: string | null
  portal?: string | null
  floor?: string | null
  door: string
  postalCode: string
  city: string
  province: string
  country?: string
  phone: string
  email?: string | null
}

export interface SanitizedRecipient {
  firstName: string
  lastName1: string
  lastName2: string
  documentType: DocumentType
  documentNumber: string
  viaType: TipoVia
  viaName: string
  number: string
  portal: string
  floor: string
  door: string
  postalCode: string
  city: string
  province: string
  country: string
  phone: string
  email: string
}

// Alias retrocompatible: el endpoint usa el nombre RecipientInput
export type RecipientInput = RawRecipient

export interface SanitizationResult {
  data: SanitizedRecipient
  errors: string[]
  valid: boolean
}

export function sanitizeRecipient(raw: RawRecipient): SanitizationResult {
  const errors: string[] = []

  const firstName = normalizeText(raw.firstName, CORREOS_MAX_LENGTHS.firstName)
  if (!firstName) errors.push("Nombre obligatorio")

  const lastName1 = normalizeText(raw.lastName1, CORREOS_MAX_LENGTHS.lastName)
  if (!lastName1) errors.push("Primer apellido obligatorio")

  const lastName2 = normalizeText(raw.lastName2 || "", CORREOS_MAX_LENGTHS.lastName)

  const documentNumber = normalizeDocument(raw.documentType, raw.documentNumber)
  if (!documentNumber) errors.push(`${raw.documentType} no valido`)

  const viaType = normalizeViaType(raw.viaType)

  const viaName = normalizeText(raw.viaName, CORREOS_MAX_LENGTHS.viaName)
  if (!viaName) errors.push("Nombre de la via obligatorio")

  const number = normalizeText(raw.number || "", CORREOS_MAX_LENGTHS.number)
  const portal = normalizeText(raw.portal || "", CORREOS_MAX_LENGTHS.portal)
  const floor = normalizeText(raw.floor || "", CORREOS_MAX_LENGTHS.floor)

  const door = normalizeText(raw.door, CORREOS_MAX_LENGTHS.door)
  if (!door) errors.push("Puerta obligatoria")

  const postalCode = normalizePostalCode(raw.postalCode)
  if (!postalCode || postalCode.length !== 5) errors.push("Codigo postal no valido (5 digitos)")

  const city = normalizeText(raw.city, CORREOS_MAX_LENGTHS.city)
  if (!city) errors.push("Localidad obligatoria")

  // Correos REST v1 requiere codigo de 2 digitos, no nombre libre.
  // Si viene texto (ej "MALAGA"), intentamos resolver el codigo; si no se conoce
  // usamos el texto para no bloquear y que Correos devuelva el error descriptivo.
  const provinceRaw = normalizeText(raw.province, CORREOS_MAX_LENGTHS.province)
  if (!provinceRaw) errors.push("Provincia obligatoria")
  const PROVINCE_CODES: Record<string, string> = {
    ALAVA:"01",ALBACETE:"02",ALICANTE:"03",ALMERIA:"04",AVILA:"05",BADAJOZ:"06",
    "ILLES BALEARS":"07",BALEARES:"07",BARCELONA:"08",BURGOS:"09",CACERES:"10",
    CADIZ:"11",CASTELLON:"12","CIUDAD REAL":"13",CORDOBA:"14","A CORUÑA":"15",
    CORUÑA:"15",CUENCA:"16",GIRONA:"17",GRANADA:"18",GUADALAJARA:"19",
    GUIPUZCOA:"20",HUELVA:"21",HUESCA:"22",JAEN:"23",LEON:"24",LLEIDA:"25",
    RIOJA:"26",LUGO:"27",MADRID:"28",MALAGA:"29",MURCIA:"30",NAVARRA:"31",
    OURENSE:"32",ASTURIAS:"33",PALENCIA:"34","LAS PALMAS":"35",PONTEVEDRA:"36",
    SALAMANCA:"37","SANTA CRUZ DE TENERIFE":"38",TENERIFE:"38",CANTABRIA:"39",
    SEGOVIA:"40",SEVILLA:"41",SORIA:"42",TARRAGONA:"43",TERUEL:"44",TOLEDO:"45",
    VALENCIA:"46",VALLADOLID:"47",VIZCAYA:"48",ZAMORA:"49",ZARAGOZA:"50",
    CEUTA:"51",MELILLA:"52",
  }
  const province = /^\d{1,2}$/.test(provinceRaw.trim())
    ? provinceRaw.trim().padStart(2, "0")
    : PROVINCE_CODES[provinceRaw.trim()] || provinceRaw

  const phone = normalizePhone(raw.phone)
  if (!phone) errors.push("Telefono no valido (9 digitos espanoles)")

  const email = normalizeEmail(raw.email || "")

  return {
    data: {
      firstName,
      lastName1,
      lastName2,
      documentType: raw.documentType,
      documentNumber,
      viaType,
      viaName,
      number,
      portal,
      floor,
      door,
      postalCode,
      city,
      province,
      country: "ESP",
      phone,
      email,
    },
    errors,
    valid: errors.length === 0,
  }
}
