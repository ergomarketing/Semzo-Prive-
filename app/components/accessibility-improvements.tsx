"use client"

import { useEffect } from "react"

// Hook para mejorar la navegación por teclado
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to main content con Alt+M
      if (event.altKey && event.key === "m") {
        event.preventDefault()
        const main = document.querySelector("main")
        if (main) {
          main.focus()
          main.scrollIntoView({ behavior: "smooth" })
        }
      }

      // Skip to navigation con Alt+N
      if (event.altKey && event.key === "n") {
        event.preventDefault()
        const nav = document.querySelector("nav")
        if (nav) {
          const firstLink = nav.querySelector("a")
          if (firstLink) {
            firstLink.focus()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])
}

// Componente para skip links
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-0 left-0 z-50 p-4 bg-indigo-dark text-white focus:relative focus:z-auto"
      >
        Saltar al contenido principal
      </a>
      <a
        href="#navigation"
        className="absolute top-0 left-0 z-50 p-4 bg-indigo-dark text-white focus:relative focus:z-auto"
      >
        Saltar a la navegación
      </a>
    </div>
  )
}

// Componente para anunciar cambios a lectores de pantalla
export function LiveRegion({ message }: { message: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
      {message}
    </div>
  )
}
