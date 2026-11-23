import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { requireAdminAuth } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  // Solo administracion: antes cualquiera podia subir ficheros al almacenamiento.
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 })
    }

    const timestamp = Date.now()
    const filename = `blog-images/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename,
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 })
  }
}
