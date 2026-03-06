import type { Metadata } from "next"
import ListaPrivadaClient from "./lista-privada-client"

export const metadata: Metadata = {
  title: "Lista Privada Marbella | Semzo Privé",
  description: "Acceso prioritario a Semzo Privé en Marbella. Bolsos de diseñador por suscripción desde 59€/mes.",
}

export default function ListaPrivadaPage() {
  return <ListaPrivadaClient />
}
