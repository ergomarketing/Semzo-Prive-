"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const CatalogGateOverlay = dynamic(() => import("./catalog-gate-overlay"), { ssr: false })

interface Props {
  isLoggedIn: boolean
}

const COOKIE_NAME = "catalog_unlocked"

function hasCookie(name: string): boolean {
  if (typeof document === "undefined") return false
  return document.cookie.split("; ").some((c) => c.startsWith(`${name}=`))
}

export default function CatalogGate({ isLoggedIn }: Props) {
  const [unlocked, setUnlocked] = useState<boolean>(true) // por defecto NO mostrar gate hasta confirmar
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    if (isLoggedIn) {
      setUnlocked(true)
      return
    }
    setUnlocked(hasCookie(COOKIE_NAME))
  }, [isLoggedIn])

  if (!hydrated || unlocked) return null

  return <CatalogGateOverlay onUnlock={() => setUnlocked(true)} />
}
