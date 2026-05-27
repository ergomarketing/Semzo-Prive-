"use client"

import useSWR from "swr"
import { AlertTriangle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface PetitePassStatus {
  has_active_pass: boolean
  reservation_id?: string
  bag_name?: string | null
  delivered_at?: string | null
  pass_expires_at?: string | null
  state?: "pending_delivery" | "active" | "expiring_soon" | "expired"
  days_remaining?: number | null
}

/**
 * Banner persistente para socias Petite con pase vencido o por vencer.
 * Solo se renderiza cuando hay urgencia (expiring_soon | expired).
 */
export function PetitePassBanner() {
  const router = useRouter()
  const { data } = useSWR<PetitePassStatus>("/api/user/petite-pass-status", fetcher, {
    refreshInterval: 5 * 60 * 1000, // refresca cada 5 min
  })

  if (!data?.has_active_pass) return null
  if (data.state !== "expiring_soon" && data.state !== "expired") return null

  const isExpired = data.state === "expired"
  const bagName = data.bag_name || "tu bolso"

  return (
    <Alert
      className={`mb-6 ${
        isExpired
          ? "bg-rose-pastel/40 border-rose-pastel"
          : "bg-rose-nude border-rose-pastel"
      }`}
    >
      {isExpired ? (
        <AlertTriangle className="h-4 w-4 text-indigo-dark" />
      ) : (
        <Clock className="h-4 w-4 text-indigo-dark" />
      )}
      <AlertDescription className="text-indigo-dark flex items-center justify-between flex-wrap gap-3">
        <div className="flex-1 min-w-[250px]">
          {isExpired ? (
            <>
              <strong>Tu pase ha vencido.</strong> {bagName} sigue contigo. Devuelvelo o
              renueva tu semana para evitar cargos por retraso.
            </>
          ) : (
            <>
              <strong>
                Tu pase termina en {data.days_remaining}{" "}
                {data.days_remaining === 1 ? "dia" : "dias"}.
              </strong>{" "}
              Devuelve {bagName} o renueva tu semana sin tener que devolverlo.
            </>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-indigo-dark/30 text-indigo-dark hover:bg-rose-pastel/40"
            onClick={() => router.push("/dashboard/reservas")}
          >
            Devolver
          </Button>
          <Button
            size="sm"
            className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
            onClick={() => router.push("/catalog")}
          >
            Comprar pase
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
