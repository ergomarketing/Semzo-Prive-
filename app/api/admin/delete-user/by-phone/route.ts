import { type NextRequest, NextResponse } from "next/server"

/**
 * Endpoint simplificado para eliminar usuario por teléfono
 * Útil para testing y limpieza rápida
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json({ error: "Parámetro 'phone' es requerido" }, { status: 400 })
    }

    console.log("[DELETE-BY-PHONE] Eliminando usuario con teléfono:", phone)

    // Llamar al endpoint principal de eliminación
    const deleteResponse = await fetch(new URL("/api/admin/delete-user", request.url).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    })

    const result = await deleteResponse.json()

    if (!deleteResponse.ok) {
      return NextResponse.json(result, { status: deleteResponse.status })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[DELETE-BY-PHONE] Error:", error)
    return NextResponse.json(
      {
        error: "Error eliminando usuario",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
