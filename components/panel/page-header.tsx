import type React from "react"

/**
 * Cabecera comun de las paginas del panel: etiqueta dorada, titulo serif, subtitulo y una accion opcional.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-xs uppercase tracking-[0.28em] text-[#b08d57]">{eyebrow}</p>}
        <h2 className="text-3xl font-serif text-indigo-dark md:text-4xl">{title}</h2>
        {subtitle && <p className="mt-1 text-base text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/** Estado vacio del panel: icono dorado, titulo serif, texto y accion. */
export function PanelEmpty({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode
  title: string
  text?: string
  action?: React.ReactNode
}) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#b08d57]/10 text-[#b08d57]">{icon}</div>
      <h3 className="font-serif text-xl text-indigo-dark">{title}</h3>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
