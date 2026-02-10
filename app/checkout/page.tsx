"use client"

import { useEffect } from "react"

export default function CheckoutPage() {
  useEffect(() => {
    // Redirigir al carrito si alguien intenta acceder directamente
    window.location.href = "/cart"
  }, [])

  return null
}
