"use client"

import { useState } from "react"
import CatalogGateOverlay from "./catalog-gate-overlay"

interface Props {
  showGate: boolean
}

export default function CatalogGate({ showGate }: Props) {
  const [visible, setVisible] = useState(showGate)
  if (!visible) return null
  return <CatalogGateOverlay onUnlock={() => setVisible(false)} />
}
