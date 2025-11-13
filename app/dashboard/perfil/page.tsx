"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { CheckCircle, Info } from "lucide-react"

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  updated_at: string | null
}

export default function PerfilPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Actualizar email en auth si cambió
      if (formData.email && formData.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email,
        })

        if (authError) throw authError
        alert("Se ha enviado un correo de verificación a tu nuevo email. Por favor, verifica tu correo.")
      }

      // Actualizar perfil
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
        })
        .eq("id", user.id)

      if (error) throw error

      await fetchProfile()
      setIsEditing(false)
      alert("Perfil actualizado correctamente")
    } catch (error: any) {
      console.error("Error saving profile:", error)
      alert(`Error al guardar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const isTemporaryEmail = (email: string | null): boolean => {
    if (!email) return true
    const temporaryDomains = ["@phone.semzoprive.com", "tu@email.com", "@temporary.com"]
    return temporaryDomains.some((domain) => email.includes(domain))
  }

  const isVerifiedPhone = (phone: string | null): boolean => {
    if (!phone) return false
    return phone.length >= 10 && !phone.includes("temp")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-slate-900 mb-2">Mi Perfil</h1>
          <p className="text-slate-600">Gestiona tu información personal</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-serif text-slate-900">Información Personal</CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Tu información de contacto y datos personales
                </CardDescription>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-slate-700 font-medium">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="border-slate-300 focus:border-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-slate-700 font-medium">
                      Apellido <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="border-slate-300 focus:border-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isTemporaryEmail(formData.email)}
                    className="border-slate-300 focus:border-slate-500 disabled:bg-slate-100"
                  />
                  {!isTemporaryEmail(formData.email) && (
                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                      <Info className="w-4 h-4" />
                      El email no se puede cambiar una vez establecido
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 font-medium">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-slate-300 focus:border-slate-500"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        first_name: profile?.first_name || "",
                        last_name: profile?.last_name || "",
                        email: profile?.email || user?.email || "",
                        phone: profile?.phone || "",
                      })
                    }}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Información Personal */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Nombre</p>
                    <p className="text-slate-900 font-medium">{profile?.first_name || "No especificado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Apellido</p>
                    <p className="text-slate-900 font-medium">{profile?.last_name || "No especificado"}</p>
                  </div>
                </div>

                {/* Email con badge */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-500">Email</p>
                    {isTemporaryEmail(profile?.email) ? (
                      <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                        Temporal
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        VERIFICADO
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-900 font-medium">{profile?.email || user?.email}</p>
                  {isTemporaryEmail(profile?.email) && (
                    <p className="text-sm text-amber-600 flex items-center gap-2 mt-2">
                      <Info className="w-4 h-4" />
                      Por favor, actualiza tu email temporal
                    </p>
                  )}
                </div>

                {/* Teléfono con badge */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-500">Teléfono</p>
                    {isVerifiedPhone(profile?.phone) && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        VERIFICADO
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-900 font-medium">{profile?.phone || "No especificado"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
