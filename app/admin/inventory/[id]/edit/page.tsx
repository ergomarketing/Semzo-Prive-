"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { getSupabaseBrowser } from "@/app/lib/supabaseClient"
import { ArrowLeft } from "lucide-react"

export default function EditBagPage() {
  const router = useRouter()
  const params = useParams()
  const bagId = params.id as string

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    status: "available",
    membership_category: "SIGNATURE",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBag()
  }, [bagId])

  async function loadBag() {
    try {
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase.from("bags").select("*").eq("id", bagId).single()

      if (error) {
        console.error("[v0] Error loading bag:", error)
        alert("Error al cargar el bolso")
        router.push("/admin/inventory")
        return
      }

      setFormData({
        name: data.name || "",
        brand: data.brand || "",
        status: data.status || "available",
        membership_category: data.membership_category || "SIGNATURE",
      })
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("Error al cargar el bolso")
      router.push("/admin/inventory")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.from("bags").update(formData).eq("id", bagId)

      if (error) {
        console.error("[v0] Error updating bag:", error)
        alert("Error al actualizar el bolso")
        return
      }

      alert("Bolso actualizado correctamente")
      router.push("/admin/inventory")
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("Error al actualizar el bolso")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <p className="text-center text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.push("/admin/inventory")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al inventario
      </Button>

      <Card className="p-6">
        <h1 className="text-2xl font-serif mb-6">Editar Bolso</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Nombre del Bolso</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Estado</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="rented">Rentado</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="membership_category">Categoría de Membresía</Label>
            <Select
              value={formData.membership_category}
              onValueChange={(value) => setFormData({ ...formData, membership_category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIGNATURE">Signature (159€)</SelectItem>
                <SelectItem value="PRIVÉ">Privé (189€)</SelectItem>
                <SelectItem value="L'ESSENTIEL">L'Essentiel (59€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/inventory")} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
