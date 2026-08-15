"use client"

import { useEffect } from "react"

const STORAGE_KEY = "semzo_pending_partner"

/**
 * Captura la atribucion de partner sin ninguna friccion para el cliente.
 *
 * Flujo:
 * 1. El partner (villa/hotel/wedding planner) comparte su enlace unico:
 *    https://semzoprive.com/?partner=MARBELLACLUB
 * 2. Al aterrizar, se guarda el codigo en localStorage. El cliente NO ve
 *    ni hace nada distinto: reserva con normalidad.
 * 3. En cada carga se intenta registrar la reclamacion via
 *    /api/partners/apply-code (que requiere sesion). Si aun no hay sesion
 *    devuelve 401 y se mantiene pendiente; en cuanto el cliente inicia
 *    sesion o se registra, la siguiente navegacion lo registra solo.
 *
 * No toca el flujo de pago ni el de auth. Es best-effort y no bloqueante.
 */
export default function PartnerCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Capturar ?partner= de la URL y guardarlo.
    try {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("partner")
      if (code) {
        localStorage.setItem(STORAGE_KEY, code.trim().toUpperCase())
      }
    } catch {
      // localStorage puede fallar en modo privado; lo ignoramos.
    }

    // 2. Intentar registrar la reclamacion si hay una pendiente.
    let pending: string | null = null
    try {
      pending = localStorage.getItem(STORAGE_KEY)
    } catch {
      pending = null
    }
    if (!pending) return

    fetch("/api/partners/apply-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: pending }),
    })
      .then((res) => {
        // ok  -> reclamacion creada
        // 400 -> codigo invalido/inactivo o autouso: no reintentar
        // 409 -> ya reclamado: no reintentar
        // 401 -> sin sesion todavia: mantener pendiente para el proximo intento
        if (res.ok || res.status === 400 || res.status === 409) {
          try {
            localStorage.removeItem(STORAGE_KEY)
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Error de red: se reintenta en la proxima carga. No bloqueante.
      })
  }, [])

  return null
}
