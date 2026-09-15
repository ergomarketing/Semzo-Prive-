import type { Metadata } from "next"
import ColeccionaClient from "./colecciona-client"

// ISR: contenido estatico, se revalida cada hora.
export const revalidate = 3600

const COLECCIONA_TITLE = "Colecciona: Convierte tu Cuota en Crédito | SEMZO PRIVÉ"
const COLECCIONA_DESCRIPTION =
  "Con Colecciona, el 100% de tu cuota mensual se acumula como crédito hacia la compra de cualquier bolso de la colección. Sin plazos. Sin presión."

export const metadata: Metadata = {
  title: {
    absolute: COLECCIONA_TITLE,
  },
  description: COLECCIONA_DESCRIPTION,
  alternates: {
    canonical: "https://semzoprive.com/colecciona",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: COLECCIONA_TITLE,
    description: COLECCIONA_DESCRIPTION,
    url: "https://semzoprive.com/colecciona",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://h0ayghjex33jktep.public.blob.vercel-storage.com/blog-images/fendi%20baguette%20colecciona.jpeg",
        width: 1200,
        height: 630,
        alt: "Colecciona — Semzo Privé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: COLECCIONA_TITLE,
    description: COLECCIONA_DESCRIPTION,
    images: ["https://h0ayghjex33jktep.public.blob.vercel-storage.com/blog-images/fendi%20baguette%20colecciona.jpeg"],
  },
}

export default function ColeccionaPage() {
  return <ColeccionaClient />
}
