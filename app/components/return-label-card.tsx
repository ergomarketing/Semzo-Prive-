"use client"

import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, FileText } from "lucide-react"

interface ReturnLabelInfo {
  available?: boolean
  bagName?: string | null
  trackingNumber?: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/** Etiqueta de devolucion de Correos del bolso en curso: se ve y se descarga en PDF. No muestra nada si no hay. */
export function ReturnLabelCard() {
  const { data } = useSWR<ReturnLabelInfo>("/api/user/return-label?info=1", fetcher)

  if (!data?.available) return null

  return (
    <Card className="border-slate-200">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-nude">
            <FileText className="h-5 w-5 text-[#7a5f33]" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-indigo-dark">Tu etiqueta de devolución</h3>
            <p className="mt-1 text-sm text-slate-600">
              Descárgala, imprímela y pégala en el paquete cuando devuelvas {data.bagName || "tu bolso"}.
            </p>
            {data.trackingNumber && (
              <p className="mt-1 text-xs text-slate-500">
                Seguimiento Correos: <span className="font-mono">{data.trackingNumber}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
            <a href="/api/user/return-label?download=1" download>
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </a>
          </Button>
          <Button asChild variant="outline" className="border-indigo-dark/20 text-indigo-dark">
            <a href="/api/user/return-label" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
