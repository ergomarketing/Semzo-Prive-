"use client"

import dynamic from "next/dynamic"

const TikTokPixel = dynamic(() => import("@/components/TikTokPixel"), { ssr: false })

export default function TikTokPixelLoader() {
  return <TikTokPixel />
}
