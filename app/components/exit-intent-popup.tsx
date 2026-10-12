"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Cormorant_Garamond } from "next/font/google"
import { X } from "lucide-react"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic", "normal"],
  display: "swap",
})

const STORAGE_KEY = "semzo_exit_intent_shown"
const IDLE_MS = 60_000
const FADE_MS = 300

export default function ExitIntentPopup() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
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
        className="relative w-full max-w-[480px] bg-[#1a1a4b] px-6 py-12 text-center sm:px-10"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-4 top-4 p-1 text-[#f4c4cc] transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f4c4cc]"
        >
          <X className="h-6 w-6" />
        </button>

        <p className="text-xs uppercase tracking-[0.3em] text-[#f4c4cc]">Antes de que te vayas</p>

        <h2
          id="exit-intent-title"
          className="mt-4 text-balance text-4xl font-medium leading-tight text-white"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Tu primer mes al 50%.
        </h2>

        <p className={`${cormorant.className} mt-3 text-xl italic text-[#f4c4cc]`}>
          Solo para nuevas socias. Solo hoy.
        </p>

        <div className="mx-auto mt-8 border border-[#f4c4cc] px-6 py-4">
          <span className="text-3xl font-medium tracking-[0.25em] text-[#f4c4cc]">PRIVE50</span>
        </div>

        <Link
          href="/membresias#planes"
          onClick={close}
          className="mt-6 block w-full bg-[#f4c4cc] px-6 py-4 text-sm font-medium uppercase tracking-[0.2em] text-[#1a1a4b] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Elegir mi membresía
        </Link>

        <p className="mt-4 text-sm text-white/70">Sin permanencia. Cancela cuando quieras.</p>
      </div>
    </div>
  )
}
