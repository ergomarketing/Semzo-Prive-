"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, Copy, X } from "lucide-react"
import { WELCOME_PROMO_CODE, setPendingPromo } from "@/lib/promo-code"

const STORAGE_KEY = "semzo_exit_intent_shown"
const IDLE_MS = 60_000
const FADE_MS = 300

function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  const w = window as unknown as { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ event: name, ...params })
}

/**
 * Pop-up de intencion de salida de /membresias.
 * Mismo bloque visual que el banner PRIVE50 de /lp/membresia (tipografia serif del
 * sitio, sin fuentes extra). Al pulsar el boton o copiar el codigo, PRIVE50 queda
 * pendiente y /cart lo aplica solo.
 */
export default function ExitIntentPopup() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const ctaClickedRef = useRef(false)
  const shownRef = useRef(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const alreadyShown = () => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return false
    }
  }

  const open = useCallback(() => {
    if (shownRef.current || ctaClickedRef.current || alreadyShown()) return
    shownRef.current = true
    try {
      sessionStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // sessionStorage no disponible: solo se mostrará una vez por carga de página
    }
    setMounted(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }, [])

  const close = useCallback(() => {
    setVisible(false)
    window.setTimeout(() => setMounted(false), FADE_MS)
  }, [])

  useEffect(() => {
    if (alreadyShown()) return

    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches

    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) open()
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest("[data-exit-intent-popup]")) return
      if (target.closest("main a, main button")) ctaClickedRef.current = true
    }

    const timer = window.setTimeout(open, IDLE_MS)
    document.addEventListener("click", onClick, true)
    if (hasFinePointer) document.addEventListener("mouseout", onMouseOut)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("mouseout", onMouseOut)
    }
  }, [open])

  useEffect(() => {
    if (!mounted) return
    closeButtonRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [mounted, close])

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(WELCOME_PROMO_CODE)
    } catch {
      // sin portapapeles: el codigo igualmente queda pendiente para el carrito
    }
    setPendingPromo()
    setCopied(true)
    trackEvent("copy_discount_code", { code: WELCOME_PROMO_CODE, source: "exit_intent" })
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleCta = () => {
    setPendingPromo()
    trackEvent("exit_intent_cta_click", { code: WELCOME_PROMO_CODE })
    close()
  }

  if (!mounted) return null

  return (
    <div
      data-exit-intent-popup
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity ease-out"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        opacity: visible ? 1 : 0,
        transitionDuration: `${FADE_MS}ms`,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-title"
        className="relative w-full max-w-xl border border-indigo-dark/20 bg-white p-6 pt-10 text-center font-serif text-indigo-dark md:p-8 md:pt-12"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-3 p-1 text-indigo-dark/60 transition hover:text-indigo-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-dark"
        >
          <X className="h-6 w-6" />
        </button>

        <p className="mb-3 text-[10px] tracking-[0.4em] text-indigo-dark/60 md:text-xs">OFERTA DE BIENVENIDA</p>

        <h2 id="exit-intent-title" className="mb-3 text-balance font-serif text-2xl leading-tight md:text-3xl">
          Tu primera mensualidad al <span className="italic">50%</span> con el código {WELCOME_PROMO_CODE}
        </h2>

        <p className="mb-4 text-sm text-indigo-dark/70">
          No es una promesa. Es tuyo desde hoy. Solo para nuevas socias. Aplica para tu primer registro.
        </p>

        <div className="mx-auto flex max-w-xs items-center justify-center gap-3">
          <span className="flex-1 border border-dashed border-indigo-dark/40 bg-rose-nude px-4 py-3 font-serif text-xl font-bold tracking-[0.2em] text-indigo-dark">
            {WELCOME_PROMO_CODE}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copiar codigo de descuento"
            className="flex h-12 w-12 items-center justify-center border border-indigo-dark/30 transition hover:bg-indigo-dark hover:text-white"
          >
            {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>

        <p className="mt-4 text-xs text-indigo-dark/60">Introduce el código durante el proceso de pago.</p>

        <Link
          href="/membresias#planes"
          onClick={handleCta}
          className="mt-6 block w-full bg-indigo-dark px-6 py-4 font-sans text-sm font-medium uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-dark"
        >
          Elegir mi membresía
        </Link>
      </div>
    </div>
  )
}
