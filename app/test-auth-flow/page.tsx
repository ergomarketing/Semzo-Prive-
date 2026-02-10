"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

export default function TestAuthFlowPage() {
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  })

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [registerLoading, setRegisterLoading] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerMessage, setRegisterMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loginMessage, setLoginMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterLoading(true)
    setRegisterMessage(null)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      })

      const result = await response.json()

      if (result.success) {
        setRegisterMessage({ type: "success", text: result.message })
        // Auto-llenar el formulario de login
        setLoginData({
          email: registerData.email,
          password: registerData.password,
        })
      } else {
        setRegisterMessage({ type: "error", text: result.error })
      }
    } catch (error) {
      setRegisterMessage({ type: "error", text: "Error de conexión" })
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginMessage(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })

      const result = await response.json()

      if (result.success) {
        setLoginMessage({
          type: "success",
          text: `Login exitoso! Bienvenido ${result.user?.firstName || result.user?.email}`,
        })
      } else {
        setLoginMessage({ type: "error", text: result.error })
      }
    } catch (error) {
      setLoginMessage({ type: "error", text: "Error de conexión" })
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prueba de Flujo de Autenticación</h1>
          <p className="text-gray-600">Registra un usuario y luego haz login para verificar que todo funciona</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulario de Registro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">1. Registro de Usuario</CardTitle>
              <CardDescription>Crea una nueva cuenta para probar el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-firstName">Nombre</Label>
                    <Input
                      id="reg-firstName"
                      type="text"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                      required
                      disabled={registerLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-lastName">Apellido</Label>
                    <Input
                      id="reg-lastName"
                      type="text"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      required
                      disabled={registerLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    disabled={registerLoading}
                    placeholder="test@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Teléfono (opcional)</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    disabled={registerLoading}
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    disabled={registerLoading}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                {registerMessage && (
                  <Alert
                    className={
                      registerMessage.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                    }
                  >
                    <AlertDescription className={registerMessage.type === "error" ? "text-red-800" : "text-green-800"}>
                      {registerMessage.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={registerLoading}>
                  {registerLoading ? "Registrando..." : "Registrar Usuario"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Formulario de Login */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">2. Login de Usuario</CardTitle>
              <CardDescription>Inicia sesión con la cuenta creada</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    disabled={loginLoading}
                    placeholder="test@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    disabled={loginLoading}
                  />
                </div>

                {loginMessage && (
                  <Alert
                    className={
                      loginMessage.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                    }
                  >
                    <AlertDescription className={loginMessage.type === "error" ? "text-red-800" : "text-green-800"}>
                      {loginMessage.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instrucciones de Prueba</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <p className="text-sm text-gray-700">
                <strong>Registro:</strong> Completa el formulario de registro con datos de prueba. Deberías recibir un
                email de bienvenida.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <p className="text-sm text-gray-700">
                <strong>Login:</strong> Usa las mismas credenciales para hacer login. El sistema debería encontrar tu
                perfil.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <p className="text-sm text-gray-700">
                <strong>Verificación:</strong> Revisa los logs de Vercel para confirmar que no hay errores y que ambas
                tablas se llenan correctamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
