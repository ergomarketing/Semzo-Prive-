"use client"

import { useEffect } from "react"
import { useAuth } from "@/app/hooks/useAuth"
import {
  captureTouch,
  getStoredAttribution,
  isAttributionSynced,
  markAttributionSynced,
} from "@/lib/attribution-client"

/**
 * Captura de atribucion ("como nos encontraron"). Se monta una vez en el
 * layout raiz, junto a PartnerCapture, para que corra en CUALQUIER pagina de
 * entrada (home, landings /lp/*, blog...) y no solo en /signup.
 *
 * 1. En cada carga completa guarda el primer/ultimo contacto en localStorage.
 * 2. Respaldo: si hay sesion y la atribucion aun no se ha enviado (altas por
 *    SMS, confirmacion de email en otro dispositivo...), la envia a
 *    /api/attribution. El servidor solo la acepta para cuentas recien creadas.
 *
 * No renderiza nada y nunca bloquea: todos los errores se ignoran.
 */
export default function AttributionCapture() {
  const { user } = useAuth()

  useEffect(() => {
    captureTouch()
  }, [])

  useEffect(() => {
    if (!user || isAttributionSynced(user.id)) return

    const { firstTouch, lastTouch } = getStoredAttribution()
    if (!firstTouch && !lastTouch) return

    fetch("/api/attribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attribution: { firstTouch, lastTouch } }),
    })
      .then((res) => {
        // ok -> guardada; 400/409 -> no aplica (cuenta antigua / payload invalido): no reintentar.
        // 401/5xx/red -> se reintenta en la proxima carga.
        if (res.ok || res.status === 400 || res.status === 409) markAttributionSynced(user.id)
      })
      .catch(() => {})
  }, [user])

  return null
}
