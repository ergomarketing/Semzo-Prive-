import { put, list } from "@vercel/blob"

async function updateBlogImage() {
  const slug = "las-cinco-marcas-de-lujo-que-mas-se-alquilaron-en-2024"

  // Nueva imagen del Jacquemus
  const newImageUrl = "/images/jacquemus-20-c2-b7-20le-20chiquito-20alquiler-20semanal-20-2csemzoprive.png"

  try {
    // Listar archivos del blog
    const { blobs } = await list({ prefix: "blog/" })

    // Buscar el archivo del artículo
    const blogFile = blobs.find((blob) => blob.pathname.includes(slug))

    if (!blogFile) {
      console.log("Artículo no encontrado")
      return
    }

    // Descargar contenido actual
    const response = await fetch(blogFile.url)
    const content = await response.text()

    // Actualizar la coverImage en el frontmatter
    const updatedContent = content.replace(/coverImage:\s*["'].*?["']/, `coverImage: "${newImageUrl}"`)

    // Subir archivo actualizado
    await put(blogFile.pathname, updatedContent, {
      access: "public",
      addRandomSuffix: false,
    })

    console.log("✅ Imagen actualizada correctamente")
  } catch (error) {
    console.error("Error:", error)
  }
}

updateBlogImage()
