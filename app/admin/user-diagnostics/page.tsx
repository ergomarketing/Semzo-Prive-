"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { AlertCircle, CheckCircle, XCircle, User, Shield } from "lucide-react"

export default function UserDiagnosticsPage() {
  const [email, setEmail] = useState("")
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const diagnoseUser = async () => {
    if (!email) return

    setLoading(true)
    setError("")
    setUserInfo(null)

    try {
      const response = await fetch("/api/admin/diagnose-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setUserInfo(result)
      }
    } catch (err) {
      setError("Error al diagnosticar usuario")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const confirmUser = async () => {
    if (!email) return

    setLoading(true)
    try {
      const response = await fetch("/api/admin/confirm-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (result.success) {
        // Refrescar diagnóstico
        await diagnoseUser()
      } else {
        setError(result.error || "Error al confirmar usuario")
      }
    } catch (err) {
      setError("Error al confirmar usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Diagnóstico de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Input
              placeholder="Email del usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={diagnoseUser} disabled={loading}>
              {loading ? "Diagnosticando..." : "Diagnosticar"}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {userInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-mono">{userInfo.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-mono text-xs">{userInfo.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Creado:</span>
                      <span>{new Date(userInfo.created_at).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Estado de Autenticación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Email Confirmado:</span>
                      {userInfo.email_confirmed_at ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Confirmado el:</span>
                      <span>
                        {userInfo.email_confirmed_at
                          ? new Date(userInfo.email_confirmed_at).toLocaleString()
                          : "No confirmado"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Último login:</span>
                      <span>
                        {userInfo.last_sign_in_at ? new Date(userInfo.last_sign_in_at).toLocaleString() : "Nunca"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {!userInfo.email_confirmed_at && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <span className="text-orange-700">Este usuario no ha confirmado su email</span>
                      </div>
                      <Button
                        onClick={confirmUser}
                        disabled={loading}
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-100 bg-transparent"
                      >
                        Confirmar Manualmente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {userInfo.profiles && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Perfil de Usuario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Nombre:</span>
                      <span>{userInfo.profiles.full_name || "No especificado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <span className="capitalize">{userInfo.profiles.status || "activo"}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
