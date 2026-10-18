import type { DocBlock } from "@/lib/colecciona-legal"

/** Pinta bloques de documento legal (contrato, anexo, condiciones). Sin estado: sirve en servidor y cliente. */
export function LegalDoc({ blocks, compact = false }: { blocks: DocBlock[]; compact?: boolean }) {
  const text = compact ? "text-[13px] leading-relaxed" : "text-sm leading-relaxed"
  return (
    <div className={`space-y-3 text-slate-700 ${text}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "title":
            return (
              <p key={index} className="font-serif text-xl tracking-wide text-indigo-dark">
                {block.text}
              </p>
            )
          case "subtitle":
            return (
              <p key={index} className="text-xs font-semibold uppercase tracking-wider text-indigo-dark">
                {block.text}
              </p>
            )
          case "heading":
            return (
              <h3 key={index} className="pt-2 font-serif text-base text-indigo-dark">
                {block.text}
              </h3>
            )
          case "paragraph":
            return (
              <p key={index}>
                {block.lead ? <strong className="text-slate-900">{block.lead} </strong> : null}
                {block.text}
              </p>
            )
          case "table":
            return (
              <div key={index} className="overflow-hidden rounded-md border border-slate-200">
                {block.rows.map(([label, value], rowIndex) => (
                  <div
                    key={rowIndex}
                    className="grid grid-cols-1 gap-1 border-b border-slate-200 px-3 py-2 last:border-b-0 sm:grid-cols-[220px_1fr]"
                  >
                    <span className="font-medium text-slate-900">{label}</span>
                    <span className="break-words">{value}</span>
                  </div>
                ))}
              </div>
            )
          case "note":
            return (
              <p key={index} className="italic text-slate-600">
                {block.text}
              </p>
            )
        }
      })}
    </div>
  )
}
