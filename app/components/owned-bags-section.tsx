"use client"

import useSWR from "swr"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, FileCheck, Calendar } from "lucide-react"

interface OwnedBag {
  id: string
  bag_id: string
  name: string
  brand: string
  model: string | null
  image_url: string | null
  purchase_price: number | null
  paid_total: number | null
  completed_at: string | null
  started_at: string | null
  authenticity_certificate_url: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const formatEUR = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(n)

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

export function OwnedBagsSection() {
  const { data, isLoading } = useSWR<{ bags: OwnedBag[] }>("/api/user/owned-bags", fetcher)

  if (isLoading) return null
  const bags = data?.bags || []
  if (bags.length === 0) return null

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 text-indigo-dark" fill="currentColor" />
        <h2 className="font-serif text-2xl text-indigo-dark">Mis bolsos</h2>
        <Badge variant="outline" className="ml-2 border-indigo-dark/30 text-indigo-dark">
          {bags.length} {bags.length === 1 ? "pieza" : "piezas"}
        </Badge>
      </div>
      <p className="mb-6 text-sm text-slate-600">Tu colección personal de piezas adquiridas a través de Semzo Privé.</p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {bags.map((bag) => (
          <Card key={bag.id} className="overflow-hidden border-slate-200 bg-white">
            <div className="relative aspect-square bg-rose-nude/20">
              {bag.image_url ? (
                <Image
                  src={bag.image_url || "/placeholder.svg"}
                  alt={`${bag.brand} ${bag.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">Sin imagen</div>
              )}
              <Badge className="absolute right-3 top-3 bg-indigo-dark text-white hover:bg-indigo-dark">
                <Heart className="mr-1 h-3 w-3" fill="currentColor" />
                Tuyo
              </Badge>
            </div>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">{bag.brand}</p>
              <h3 className="mt-0.5 font-serif text-lg text-indigo-dark">{bag.name}</h3>
              {bag.model && <p className="text-sm text-slate-600">{bag.model}</p>}

              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-xs">Adquirido el {formatDate(bag.completed_at)}</span>
                </div>
                {bag.purchase_price != null && (
                  <p className="text-xs text-slate-500">Precio: {formatEUR(bag.purchase_price)}</p>
                )}
              </div>

              {bag.authenticity_certificate_url && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full border-indigo-dark/30 text-indigo-dark hover:bg-rose-nude/30 bg-transparent"
                >
                  <a href={bag.authenticity_certificate_url} target="_blank" rel="noopener noreferrer">
                    <FileCheck className="mr-2 h-3.5 w-3.5" />
                    Certificado de autenticidad
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
