"use client"

import { useCallback, useEffect, useState } from "react"

/** Estado del "proximo bolso" (ver lib/next-bag-queue.ts). Subconjunto que usa el frontend. */
export interface NextBagInfo {
  hasBagInHand: boolean
  canQueue: boolean
  windowOpen: boolean
  windowOpensAt: string | null
  renewalDate: string | null
  daysToRenewal: number | null
  reason: string | null
  ongoing: { id: string; status: string; bagLabel: string } | null
  queued: { id: string; bagId: string; bagLabel: string; imageUrl: string | null; createdAt: string } | null
}

// Una sola peticion compartida entre todas las tarjetas del catalogo (60 s de cache).
const TTL_MS = 60_000
let cached: { userId: string; at: number; promise: Promise<NextBagInfo | null> } | null = null

function load(userId: string, force = false): Promise<NextBagInfo | null> {
  if (!force && cached && cached.userId === userId && Date.now() - cached.at < TTL_MS) return cached.promise
  const promise = fetch("/api/user/next-bag", { cache: "no-store" })
    .then((res) => (res.ok ? (res.json() as Promise<NextBagInfo>) : null))
    .catch(() => null)
  cached = { userId, at: Date.now(), promise }
  return promise
}

export function useNextBag(userId?: string | null) {
  const [state, setState] = useState<NextBagInfo | null>(null)

  useEffect(() => {
    let alive = true
    if (!userId) {
      setState(null)
      return
    }
    load(userId).then((data) => alive && setState(data))
    return () => {
      alive = false
    }
  }, [userId])

  const refresh = useCallback(async () => {
    if (!userId) return null
    const data = await load(userId, true)
    setState(data)
    return data
  }, [userId])

  return { nextBag: state, refreshNextBag: refresh }
}
