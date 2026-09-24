import { read, utils } from "xlsx"
import fs from "fs"

const buf = fs.readFileSync("data/semzo_opcion_compra-caccda.xlsx")
const wb = read(buf, { cellDates: true })
console.log("SHEETS:", wb.SheetNames)
const sheet = wb.Sheets["Bolsos"]
const rows = utils.sheet_to_json(sheet, { defval: null })
console.log("HEADERS:", Object.keys(rows[0]))
const targets = ["Fendi Mini Peekaboo", "Gucci Bamboo 1947", "Cassandre", "Reverie", "Marni Tribeca", "College"]
for (const r of rows) {
  const name = Object.values(r)[0]
  if (typeof name === "string" && targets.some((t) => name.includes(t))) {
    console.log(JSON.stringify(r, null, 1))
  }
}
