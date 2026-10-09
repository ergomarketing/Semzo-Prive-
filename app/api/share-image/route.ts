import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export const runtime = "nodejs"

const ALLOWED_HOST_SUFFIXES = [".public.blob.vercel-storage.com", ".supabase.co", "semzoprive.com", ".semzoprive.com"]

function isAllowedHost(hostname: string) {
  return ALLOWED_HOST_SUFFIXES.some((suffix) => hostname === suffix.replace(/^\./, "") || hostname.endsWith(suffix))
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src")
  if (!src) return NextResponse.json({ error: "Missing src" }, { status: 400 })

  let target: URL
  try {
    target = new URL(src, req.nextUrl.origin)
  } catch {
    return NextResponse.json({ error: "Invalid src" }, { status: 400 })
  }

  const sameOrigin = target.origin === req.nextUrl.origin
  if (target.protocol !== "https:" && !sameOrigin) {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 })
  }
  if (!sameOrigin && !isAllowedHost(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 })
  }

  try {
    const upstream = await fetch(target.toString(), { cache: "force-cache" })
    if (!upstream.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 })

    const input = Buffer.from(await upstream.arrayBuffer())
    const jpeg = await sharp(input)
      .rotate()
      .resize({ width: 1440, height: 1440, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 88 })
      .toBuffer()

    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    })
  } catch {
    return NextResponse.json({ error: "Could not process image" }, { status: 500 })
  }
}
