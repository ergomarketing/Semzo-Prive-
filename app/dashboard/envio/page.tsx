"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2, Save } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface ShippingInfo {
  shipping_address: string
  shipping_city: string
  shipping_postal_code: string
  shipping_phone: string
}

export default function EnvioPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    shipping_address: "",
    shipping_city: "",
    shipping_postal_code: "",
    shipping_phone: "",
  })

  useEffect(() => {
    const fetchShippingInfo = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

        if (error) throw error

        if (data) {
          setShippingInfo({
            shipping_address: data.shipping_address || "",
            shipping_city: data.shipping_city || "",
            shipping_postal_code: data.shipping_postal_code || "",
            shipping_phone: data.phone || "",
          })
        }
      } catch (error) {
        console.error("Error fetching shipping info:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchShippingInfo()
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          shipping_address: shippingInfo.shipping_address,
          shipping_city: shippingInfo.shipping_city,
          shipping_postal_code: shippingInfo.shipping_postal_code,
          phone: shippingInfo.shipping_phone,
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Dirección guardada",
        description: "Tu dirección de envío se ha actualizado correctamente",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error saving shipping info:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la dirección. Inténtalo de nuevo.",
        variant: "destructive",
        duration: 3000,
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-slate-900 mb-2">Dirección de Envío</h2>
        <p className="text-slate-600">Configura tu dirección de envío para recibir tus bolsos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Información de Envío
          </CardTitle>
          <CardDescription>Asegúrate de que tu dirección esté completa y sea correcta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Dirección Completa</Label>
            <Input
              id="address"
              placeholder="Calle, número, piso, puerta"
              value={shippingInfo.shipping_address}
              onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_address: e.target.value })}
              className="border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                placeholder="Madrid"
                value={shippingInfo.shipping_city}
                onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_city: e.target.value })}
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal">Código Postal</Label>
              <Input
                id="postal"
                placeholder="28001"
                value={shippingInfo.shipping_postal_code}
                onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_postal_code: e.target.value })}
                className="border-slate-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono de Contacto</Label>
            <Input
              id="phone"
              placeholder="+34 600 000 000"
              value={shippingInfo.shipping_phone}
              onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_phone: e.target.value })}
              className="border-slate-300"
            />
          </div>

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
                Guardar Dirección
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
