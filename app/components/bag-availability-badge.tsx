"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Calendar } from "lucide-react"
import { useState } from "react"
import { getSupabaseBrowser } from "@/app/lib/supabaseClient"

interface BagAvailabilityBadgeProps {
  bagId: string
  bagName: string
  status: "available" | "rented" | "maintenance"
  onNotifyClick?: () => void
}

export default function BagAvailabilityBadge({ bagId, bagName, status, onNotifyClick }: BagAvailabilityBadgeProps) {
  const [isAddingToWaitlist, setIsAddingToWaitlist] = useState(false)
  const [isInWaitlist, setIsInWaitlist] = useState(false)

  const addToWaitlist = async () => {
    setIsAddingToWaitlist(true)
    try {
      const supabase = getSupabaseBrowser()

      if (!supabase) {
        alert("Error de configuración. Contacta al administrador.")
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("Debes iniciar sesión para unirte a la lista de espera")
        return
      }

      // Verificar si ya está en la lista de espera
      const { data: existing } = await supabase
        .from("waitlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("bag_id", bagId)
        .single()

      if (existing) {
        setIsInWaitlist(true)
        alert("Ya estás en la lista de espera para este bolso")
        return
      }

      // Agregar a la lista de espera
      const { error } = await supabase.from("waitlist").insert({
        user_id: user.id,
        bag_id: bagId,
        bag_name: bagName,
      })

      if (error) throw error

      setIsInWaitlist(true)
      alert("¡Te notificaremos cuando este bolso esté disponible!")
      onNotifyClick?.()
    } catch (error) {
      console.error("Error al agregar a lista de espera:", error)
      alert("Hubo un error. Por favor intenta de nuevo.")
    } finally {
      setIsAddingToWaitlist(false)
    }
  }

  if (status === "available") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <Calendar className="w-3 h-3 mr-1" />
        Disponible
      </Badge>
    )
  }

  if (status === "rented") {
    return (
      <div className="flex flex-col gap-2">
        <Badge className="bg-rose-pastel/50 text-indigo-dark border-rose-200">Fuera con Miembro</Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={addToWaitlist}
          disabled={isAddingToWaitlist || isInWaitlist}
          className="border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white bg-transparent"
        >
          <Bell className="w-4 h-4 mr-2" />
          {isInWaitlist ? "En Lista de Espera" : "Notificarme"}
        </Button>
      </div>
    )
  }

  return <Badge className="bg-amber-100 text-amber-800 border-amber-200">En Mantenimiento</Badge>
}
