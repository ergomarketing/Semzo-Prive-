"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, Loader2, Save, AlertTriangle } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { SPANISH_PROVINCES, VIA_TYPES } from "@/lib/spanish-provinces"

interface ShippingForm {
  shipping_first_name: string
  shipping_last_name_1: string
  shipping_last_name_2: string
  shipping_document_type: string
  shipping_document_number: string
  shipping_via_type: string
  shipping_via_name: string
  shipping_number: string
  shipping_portal: string
  shipping_floor: string
  shipping_door: string
  shipping_postal_code: string
  shipping_city: string
  shipping_province: string
  shipping_phone: string
}

const EMPTY: ShippingForm = {
  shipping_first_name: "",
  shipping_last_name_1: "",
  shipping_last_name_2: "",
  shipping_document_type: "DNI",
  shipping_document_number: "",
  shipping_via_type: "CALLE",
  shipping_via_name: "",
  shipping_number: "",
  shipping_portal: "",
  shipping_floor: "",
  shipping_door: "",
  shipping_postal_code: "",
  shipping_city: "",
  shipping_province: "",
  shipping_phone: "",
}

const REQUIRED_FIELDS: (keyof ShippingForm)[] = [
  "shipping_first_name",
  "shipping_last_name_1",
  "shipping_document_type",
  "shipping_document_number",
  "shipping_via_type",
  "shipping_via_name",
  "shipping_door",
  "shipping_postal_code",
  "shipping_city",
  "shipping_province",
  "shipping_phone",
]

export default function EnvioPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ShippingForm>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchShippingInfo = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
        if (error) throw error

        if (data) {
          setForm({
            shipping_first_name: data.shipping_first_name || data.first_name || "",
            shipping_last_name_1: data.shipping_last_name_1 || data.last_name || "",
            shipping_last_name_2: data.shipping_last_name_2 || "",
            shipping_document_type: data.shipping_document_type || data.document_type?.toUpperCase() || "DNI",
            shipping_document_number: data.shipping_document_number || data.document_number || "",
            shipping_via_type: data.shipping_via_type || "CALLE",
            shipping_via_name: data.shipping_via_name || "",
            shipping_number: data.shipping_number || "",
            shipping_portal: data.shipping_portal || "",
            shipping_floor: data.shipping_floor || "",
            shipping_door: data.shipping_door || "",
            shipping_postal_code: data.shipping_postal_code || "",
            shipping_city: data.shipping_city || "",
            shipping_province: data.shipping_province || "",
            shipping_phone: data.shipping_phone || data.phone || "",
          })
        }
      } catch (e) {
        console.error("Error fetching shipping info:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchShippingInfo()
  }, [user])

  const update = (key: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    for (const k of REQUIRED_FIELDS) {
      if (!form[k] || form[k].trim() === "") next[k] = "Obligatorio"
    }
    if (form.shipping_postal_code && !/^\d{5}$/.test(form.shipping_postal_code.trim())) {
      next.shipping_postal_code = "Debe tener 5 dígitos"
    }
    if (form.shipping_phone && !/^[6-9]\d{8}$/.test(form.shipping_phone.replace(/\D/g, "").replace(/^34/, ""))) {
      next.shipping_phone = "Móvil español de 9 dígitos"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!user) return
    if (!validate()) {
      toast({
        title: "Revisa los campos",
        description: "Hay campos obligatorios por completar",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (!token) throw new Error("Sesión inválida")

      const res = await fetch("/api/user/shipping", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.missing) {
          const missingMap: Record<string, string> = {}
          for (const m of data.missing) missingMap[m] = "Obligatorio"
          setErrors(missingMap)
        }
        throw new Error(data.error || "Error guardando")
      }

      toast({
        title: "Dirección guardada",
        description: "Tus datos de envío se han actualizado correctamente",
      })
    } catch (e: any) {
      console.error("Error saving shipping info:", e)
      toast({
        title: "Error",
        description: e.message || "No se pudo guardar la dirección",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  const fieldClass = (k: keyof ShippingForm) =>
    errors[k] ? "border-red-500 focus-visible:ring-red-500" : "border-slate-300"

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-slate-900 mb-2">Dirección de Envío</h2>
        <p className="text-slate-600">
          Completa todos los campos para que podamos enviarte tus bolsos a través de Correos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Información de Envío
          </CardTitle>
          <CardDescription>
            Estos datos se usan para generar la etiqueta de envío. Asegúrate de que sean exactos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Datos personales */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Datos personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={form.shipping_first_name}
                  onChange={(e) => update("shipping_first_name", e.target.value)}
                  className={fieldClass("shipping_first_name")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name_1">
                  Primer apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name_1"
                  value={form.shipping_last_name_1}
                  onChange={(e) => update("shipping_last_name_1", e.target.value)}
                  className={fieldClass("shipping_last_name_1")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name_2">Segundo apellido</Label>
                <Input
                  id="last_name_2"
                  value={form.shipping_last_name_2}
                  onChange={(e) => update("shipping_last_name_2", e.target.value)}
                  className={fieldClass("shipping_last_name_2")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document_type">
                  Tipo de documento <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.shipping_document_type}
                  onValueChange={(v) => update("shipping_document_type", v)}
                >
                  <SelectTrigger id="document_type" className={fieldClass("shipping_document_type")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="NIE">NIE</SelectItem>
                    <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="document_number">
                  Número de documento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="document_number"
                  placeholder="12345678A"
                  value={form.shipping_document_number}
                  onChange={(e) => update("shipping_document_number", e.target.value.toUpperCase())}
                  className={fieldClass("shipping_document_number")}
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-slate-900">Dirección</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="via_type">
                  Tipo de vía <span className="text-red-500">*</span>
                </Label>
                <Select value={form.shipping_via_type} onValueChange={(v) => update("shipping_via_type", v)}>
                  <SelectTrigger id="via_type" className={fieldClass("shipping_via_type")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIA_TYPES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="via_name">
                  Nombre de la vía <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="via_name"
                  placeholder="Alcalá"
                  value={form.shipping_via_name}
                  onChange={(e) => update("shipping_via_name", e.target.value)}
                  className={fieldClass("shipping_via_name")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  placeholder="459"
                  value={form.shipping_number}
                  onChange={(e) => update("shipping_number", e.target.value)}
                  className={fieldClass("shipping_number")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal">Portal</Label>
                <Input
                  id="portal"
                  value={form.shipping_portal}
                  onChange={(e) => update("shipping_portal", e.target.value)}
                  className={fieldClass("shipping_portal")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Piso</Label>
                <Input
                  id="floor"
                  placeholder="2"
                  value={form.shipping_floor}
                  onChange={(e) => update("shipping_floor", e.target.value)}
                  className={fieldClass("shipping_floor")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="door">
                  Puerta <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="door"
                  placeholder="A"
                  value={form.shipping_door}
                  onChange={(e) => update("shipping_door", e.target.value)}
                  className={fieldClass("shipping_door")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal">
                  Código postal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="postal"
                  placeholder="28027"
                  maxLength={5}
                  value={form.shipping_postal_code}
                  onChange={(e) => update("shipping_postal_code", e.target.value.replace(/\D/g, ""))}
                  className={fieldClass("shipping_postal_code")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">
                  Localidad <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Madrid"
                  value={form.shipping_city}
                  onChange={(e) => update("shipping_city", e.target.value)}
                  className={fieldClass("shipping_city")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">
                  Provincia <span className="text-red-500">*</span>
                </Label>
                <Select value={form.shipping_province} onValueChange={(v) => update("shipping_province", v)}>
                  <SelectTrigger id="province" className={fieldClass("shipping_province")}>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[260px]">
                    {SPANISH_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-slate-900">Contacto</h3>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Móvil de contacto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="600000000"
                value={form.shipping_phone}
                onChange={(e) => update("shipping_phone", e.target.value)}
                className={fieldClass("shipping_phone")}
              />
              <p className="text-xs text-slate-500">
                Correos enviará un SMS con el código de seguimiento a este número.
              </p>
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>Hay campos obligatorios sin completar o con formato incorrecto.</span>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-serif"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar dirección
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
