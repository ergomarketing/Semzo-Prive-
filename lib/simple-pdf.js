/**
 * Generador de PDF de texto, sin dependencias (el proyecto no permite anadir librerias nuevas).
 *
 * Soporta: A4, Helvetica / Helvetica-Bold / Helvetica-Oblique (fuentes estandar PDF, codificacion
 * WinAnsi = acentos, enes, euro y comillas tipograficas), parrafos con "lead" en negrita, titulos,
 * tablas de dos columnas, notas en cursiva, saltos de pagina y pie con numero de pagina.
 * No soporta imagenes (a proposito: el contrato es solo texto).
 *
 * Entrada: bloques { type: "title" | "subtitle" | "heading" | "paragraph" | "table" | "note", ... }
 * (los mismos DocBlock de lib/colecciona-legal.ts). Salida: Uint8Array con el PDF.
 *
 * Esta escrito en JS plano para poder probarlo sin compilar TypeScript (ver lib/simple-pdf.d.ts).
 */

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN_X = 56
const MARGIN_TOP = 64
const MARGIN_BOTTOM = 64

// Anchos Helvetica (AFM) para ASCII 32..126, en milesimas de em.
const W_REGULAR = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,
  722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556,
  556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334,
  260, 334, 584,
]
const W_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833,
  722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611,
  556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389,
  280, 389, 584,
]

// Unicode -> byte WinAnsi (cp1252) para los caracteres fuera de ASCII/Latin-1 que usan los contratos.
const SPECIAL = {
  0x20ac: 0x80, // €
  0x2026: 0x85, // …
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93, // “
  0x201d: 0x94, // ”
  0x2022: 0x95, // •
  0x2013: 0x96, // –
  0x2014: 0x97, // —
}

function toWinAnsi(text) {
  let out = ""
  for (const ch of String(text)) {
    const code = ch.codePointAt(0)
    if (code === 0x0a || code === 0x0d || code === 0x09) out += " "
    else if (code >= 32 && code < 127) out += ch
    else if (code >= 160 && code <= 255) out += String.fromCharCode(code)
    else if (SPECIAL[code] !== undefined) out += String.fromCharCode(SPECIAL[code])
    else out += "?"
  }
  return out
}

function charWidth(byte, bold) {
  if (byte >= 32 && byte <= 126) return (bold ? W_BOLD : W_REGULAR)[byte - 32]
  if (byte === 0x80) return 556 // €
  if (byte === 0x85) return 1000 // …
  if (byte === 0x91 || byte === 0x92) return 222
  if (byte === 0x93 || byte === 0x94) return bold ? 500 : 333
  if (byte === 0x95) return 350
  if (byte === 0x96) return 556
  if (byte === 0x97) return 1000
  if (byte === 0xb7) return 278 // ·
  if (byte === 0xab || byte === 0xbb) return 556 // « »
  // letras acentuadas: mismo ancho que la base (aproximacion segura)
  return bold ? 600 : 556
}

// Margen de seguridad (+2 %) para no desbordar el ancho por pequenas diferencias de metrica.
function textWidth(text, size, bold) {
  let units = 0
  for (let i = 0; i < text.length; i++) units += charWidth(text.charCodeAt(i), bold)
  return (units * size * 1.02) / 1000
}

function escapePdf(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

/** Parte un texto en lineas que caben en maxWidth. runs = [{ text, bold }]; devuelve lineas de runs. */
function wrapRuns(runs, size, maxWidth) {
  const words = []
  for (const run of runs) {
    const parts = toWinAnsi(run.text).split(/ +/)
    for (const part of parts) {
      if (part === "") continue
      const bold = !!run.bold
      if (textWidth(part, size, bold) <= maxWidth) {
        words.push({ text: part, bold })
        continue
      }
      // Palabra mas ancha que la linea (p. ej. una URL larga): se parte en trozos que quepan.
      let piece = ""
      for (const ch of part) {
        if (piece !== "" && textWidth(piece + ch, size, bold) > maxWidth) {
          words.push({ text: piece, bold })
          piece = ch
        } else piece += ch
      }
      if (piece !== "") words.push({ text: piece, bold })
    }
  }
  const lines = []
  let current = []
  let width = 0
  const space = (bold) => textWidth(" ", size, bold)
  for (const word of words) {
    const w = textWidth(word.text, size, word.bold)
    const add = current.length === 0 ? w : space(word.bold) + w
    if (current.length > 0 && width + add > maxWidth) {
      lines.push(current)
      current = [word]
      width = w
    } else {
      current.push(word)
      width += add
    }
  }
  if (current.length > 0) lines.push(current)
  return lines.length > 0 ? lines : [[]]
}

/** Dibuja una linea de runs en (x, y). Cada palabra lleva su fuente; los espacios van en la fuente anterior. */
function lineOps(line, x, y, size, defaultFont) {
  if (line.length === 0) return ""
  let ops = `BT ${x.toFixed(2)} ${y.toFixed(2)} Td\n`
  let font = null
  line.forEach((word, index) => {
    const wanted = word.bold ? "F2" : defaultFont
    const text = (index > 0 ? " " : "") + word.text
    if (wanted !== font) {
      ops += `/${wanted} ${size} Tf\n`
      font = wanted
    }
    ops += `(${escapePdf(text)}) Tj\n`
  })
  ops += "ET\n"
  return ops
}

/**
 * @param {Array<object>} blocks bloques del documento
 * @param {{ title?: string, footer?: string }} [options]
 * @returns {Uint8Array}
 */
export function buildSimplePdf(blocks, options = {}) {
  const contentWidth = PAGE_W - MARGIN_X * 2
  const pages = [] // cada pagina: string de operadores
  let ops = ""
  let y = PAGE_H - MARGIN_TOP

  const newPage = () => {
    pages.push(ops)
    ops = ""
    y = PAGE_H - MARGIN_TOP
  }
  const ensure = (height) => {
    if (y - height < MARGIN_BOTTOM) newPage()
  }

  const drawLines = (lines, x, size, leading, defaultFont) => {
    for (const line of lines) {
      ensure(leading)
      y -= leading
      ops += lineOps(line, x, y, size, defaultFont)
    }
  }

  for (const block of blocks) {
    if (block.type === "title") {
      ensure(40)
      y -= 6
      drawLines(wrapRuns([{ text: block.text, bold: true }], 18, contentWidth), MARGIN_X, 18, 22, "F2")
      y -= 4
    } else if (block.type === "subtitle") {
      drawLines(wrapRuns([{ text: block.text, bold: true }], 10, contentWidth), MARGIN_X, 10, 14, "F2")
      y -= 10
    } else if (block.type === "heading") {
      ensure(40)
      y -= 10
      drawLines(wrapRuns([{ text: block.text, bold: true }], 12, contentWidth), MARGIN_X, 12, 16, "F2")
      y -= 3
    } else if (block.type === "paragraph") {
      const runs = []
      if (block.lead) runs.push({ text: block.lead + " ", bold: true })
      runs.push({ text: block.text, bold: false })
      const paragraphLines = wrapRuns(runs, 10, contentWidth)
      // Un parrafo corto no se parte entre paginas (evita una "I." suelta arriba de la pagina siguiente).
      if (paragraphLines.length <= 4) ensure(paragraphLines.length * 13.5)
      drawLines(paragraphLines, MARGIN_X, 10, 13.5, "F1")
      y -= 6
    } else if (block.type === "note") {
      const noteLines = wrapRuns([{ text: block.text, bold: false }], 9.5, contentWidth)
      if (noteLines.length <= 4) ensure(noteLines.length * 13)
      drawLines(noteLines, MARGIN_X, 9.5, 13, "F3")
      y -= 6
    } else if (block.type === "table") {
      const labelW = 170
      const pad = 5
      const valueW = contentWidth - labelW - pad * 3
      for (const [label, value] of block.rows) {
        const labelLines = wrapRuns([{ text: label, bold: true }], 9.5, labelW - pad)
        const valueLines = wrapRuns([{ text: value, bold: false }], 9.5, valueW)
        const rows = Math.max(labelLines.length, valueLines.length)
        const rowH = rows * 12.5 + pad * 2
        ensure(rowH)
        const top = y
        // filete superior e inferior de la fila
        ops += `0.8 0.8 0.8 RG 0.5 w ${MARGIN_X} ${(top).toFixed(2)} m ${MARGIN_X + contentWidth} ${top.toFixed(2)} l S\n`
        ops += `0.8 0.8 0.8 RG 0.5 w ${MARGIN_X} ${(top - rowH).toFixed(2)} m ${MARGIN_X + contentWidth} ${(top - rowH).toFixed(2)} l S\n`
        labelLines.forEach((line, i) => {
          ops += lineOps(line, MARGIN_X + pad, top - pad - 9.5 - i * 12.5, 9.5, "F2")
        })
        valueLines.forEach((line, i) => {
          ops += lineOps(line, MARGIN_X + labelW + pad * 2, top - pad - 9.5 - i * 12.5, 9.5, "F1")
        })
        y = top - rowH
      }
      y -= 8
    }
  }
  pages.push(ops)

  // Pie de pagina con numeracion (ahora que se sabe el total)
  const total = pages.length
  const footerText = toWinAnsi(options.footer || "")
  const finalStreams = pages.map((content, index) => {
    const label = `${footerText}${footerText ? "  ·  " : ""}Página ${index + 1} de ${total}`
    const text = toWinAnsi(label)
    const w = textWidth(text, 8, false)
    return (
      content +
      `0.45 0.45 0.45 rg BT ${(PAGE_W / 2 - w / 2).toFixed(2)} ${(MARGIN_BOTTOM - 28).toFixed(2)} Td /F1 8 Tf (${escapePdf(text)}) Tj ET\n`
    )
  })

  // --- Ensamblado de objetos PDF ---
  const objects = []
  const add = (body) => {
    objects.push(body)
    return objects.length // numero de objeto (1-based)
  }
  const catalogId = add("") // se rellena luego
  const pagesId = add("")
  const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
  const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
  const fontItalic = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>")
  const infoId = add(`<< /Title (${escapePdf(toWinAnsi(options.title || "Documento"))}) /Producer (Semzo Prive) /Creator (Semzo Prive) >>`)

  const pageIds = []
  finalStreams.forEach((stream) => {
    const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`)
    const pageId = add(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R /F3 ${fontItalic} 0 R >> >> /Contents ${contentId} 0 R >>`,
    )
    pageIds.push(pageId)
  })
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`

  let pdf = "%PDF-1.4\n%âãÏÓ\n"
  const offsets = []
  objects.forEach((body, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

  // 1 caracter = 1 byte (todo es <= 255)
  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  return bytes
}
