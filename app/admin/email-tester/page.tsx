"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { emailLogger } from "@/app/lib/email-logger"

export default function EmailTesterPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [bagDetails, setBagDetails] = useState({
    bagName: "Pont Neuf MM",
    bagBrand: "Louis Vuitton",
    membershipType: "signature" as "essentiel" | "signature" | "prive",
    waitingListPosition: 3,
    totalWaiting: 12,
    reservationId: "RES-" + Date.now(),
    availableDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 días después
  })

  const sendTestEmail = async (type: string) => {
    if (!email || !name) {
      setResult({
        success: false,
        message: "Por favor, introduce un email y nombre válidos",
      })
      return
    }

    setLoading(type)
    setResult(null)

    try {
      // Registrar el email como pendiente
      const logId = Date.now().toString()
      emailLogger.logEmail(type, email, `Test ${type}`, "pending", { name, ...bagDetails })

      // Simular envío de email según el tipo
      let endpoint = ""
      let payload = {}

      switch (type) {
        case "welcome":
          endpoint = "/api/emails/send-welcome"
          payload = { email, name }
          break
        case "waiting_list":
          endpoint = "/api/emails/test-send"
          payload = {
            type: "waiting_list_confirmation",
            email,
            name,
            bagName: bagDetails.bagName,
            bagBrand: bagDetails.bagBrand,
            membershipType: bagDetails.membershipType,
            waitingListPosition: bagDetails.waitingListPosition,
            totalWaiting: bagDetails.totalWaiting,
          }
          break
        case "bag_available":
          endpoint = "/api/emails/test-send"
          payload = {
            type: "bag_available",
            email,
            name,
            bagName: bagDetails.bagName,
            bagBrand: bagDetails.bagBrand,
            membershipType: bagDetails.membershipType,
            reservationId: bagDetails.reservationId,
          }
          break
        case "reservation_confirmed":
          endpoint = "/api/emails/test-send"
          payload = {
            type: "reservation_confirmed",
            email,
            name,
            bagName: bagDetails.bagName,
            bagBrand: bagDetails.bagBrand,
            membershipType: bagDetails.membershipType,
            availableDate: bagDetails.availableDate,
          }
          break
        case "return_reminder":
          endpoint = "/api/emails/test-send"
          payload = {
            type: "return_reminder",
            email,
            name,
            bagName: bagDetails.bagName,
            bagBrand: bagDetails.bagBrand,
            membershipType: bagDetails.membershipType,
            availableDate: bagDetails.availableDate,
          }
          break
        case "welcome_membership":
          endpoint = "/api/emails/test-send"
          payload = {
            type: "welcome_membership",
            email,
            name,
            membershipType: bagDetails.membershipType,
          }
          break
      }

      // Simular retraso de red
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Actualizar el estado del email a enviado
      emailLogger.updateEmailStatus(logId, "sent")

      setResult({
        success: true,
        message: `Email de prueba "${type}" enviado a ${email}`,
      })
    } catch (error) {
      console.error("Error enviando email de prueba:", error)
      setResult({
        success: false,
        message: `Error al enviar el email: ${error instanceof Error ? error.message : "Error desconocido"}`,
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-slate-900 mb-2">Probador de Emails</h1>
        <p className="text-slate-600">
          Utiliza esta herramienta para probar el envío de diferentes tipos de emails a los usuarios
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de prueba</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email de destino</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del destinatario</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="María García" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Detalles del bolso (para emails relacionados)</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bagBrand" className="text-xs">
                  Marca
                </Label>
                <Input
                  id="bagBrand"
                  value={bagDetails.bagBrand}
                  onChange={(e) => setBagDetails({ ...bagDetails, bagBrand: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bagName" className="text-xs">
                  Modelo
                </Label>
                <Input
                  id="bagName"
                  value={bagDetails.bagName}
                  onChange={(e) => setBagDetails({ ...bagDetails, bagName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="membershipType" className="text-xs">
                  Tipo de membresía
                </Label>
                <select
                  id="membershipType"
                  value={bagDetails.membershipType}
                  onChange={(e) => setBagDetails({ ...bagDetails, membershipType: e.target.value as any })}
                  className="w-full p-2 border border-slate-200 rounded-md"
                >
                  <option value="essentiel">L'Essentiel</option>
                  <option value="signature">Signature</option>
                  <option value="prive">Privé</option>
                </select>
              </div>
              <div>
                <Label htmlFor="availableDate" className="text-xs">
                  Fecha disponible
                </Label>
                <Input
                  id="availableDate"
                  type="date"
                  value={bagDetails.availableDate}
                  onChange={(e) => setBagDetails({ ...bagDetails, availableDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="welcome">
        <TabsList className="grid grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="welcome">Bienvenida</TabsTrigger>
          <TabsTrigger value="waiting_list">Lista de espera</TabsTrigger>
          <TabsTrigger value="bag_available">Bolso disponible</TabsTrigger>
          <TabsTrigger value="reservation_confirmed">Reserva confirmada</TabsTrigger>
          <TabsTrigger value="return_reminder">Recordatorio</TabsTrigger>
          <TabsTrigger value="welcome_membership">Membresía</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-8">
          <TabsContent value="welcome" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email de Bienvenida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  Este email se envía cuando un usuario se registra por primera vez en la plataforma.
                </p>
                <Button onClick={() => sendTestEmail("welcome")} disabled={loading !== null}>
                  {loading === "welcome" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar email de prueba"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waiting_list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email de Lista de Espera</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  Este email se envía cuando un usuario se añade a la lista de espera para un bolso.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="waitingListPosition" className="text-xs">
                      Posición en lista
                    </Label>
                    <Input
                      id="waitingListPosition"
                      type="number"
                      value={bagDetails.waitingListPosition}
                      onChange={(e) =>
                        setBagDetails({ ...bagDetails, waitingListPosition: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalWaiting" className="text-xs">
                      Total en espera
                    </Label>
                    <Input
                      id="totalWaiting"
                      type="number"
                      value={bagDetails.totalWaiting}
                      onChange={(e) => setBagDetails({ ...bagDetails, totalWaiting: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <Button onClick={() => sendTestEmail("waiting_list")} disabled={loading !== null}>
                  {loading === "waiting_list" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar email de prueba"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bag_available" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email de Bolso Disponible</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  Este email se envía cuando un bolso que el usuario estaba esperando está disponible.
                </p>
                <div className="mb-4">
                  <Label htmlFor="reservationId" className="text-xs">
                    ID de Reserva
                  </Label>
                  <Input
                    id="reservationId"
                    value={bagDetails.reservationId}
                    onChange={(e) => setBagDetails({ ...bagDetails, reservationId: e.target.value })}
                  />
                </div>
                <Button onClick={() => sendTestEmail("bag_available")} disabled={loading !== null}>
                  {loading === "bag_available" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar email de prueba"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reservation_confirmed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email de Reserva Confirmada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">Este email se envía cuando se confirma la reserva de un bolso.</p>
                <Button onClick={() => sendTestEmail("reservation_confirmed")} disabled={loading !== null}>
                  {loading === "reservation_confirmed" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar email de prueba"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="return_reminder" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email de Recordatorio de Devolución</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  Este email se envía para recordar al usuario que debe devolver el bolso.
                </p>
                <Button onClick={() => sendTestEmail("return_reminder")} disabled={loading !== null}>
                  {loading === "return_reminder" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar email de prueba"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="welcome_membership" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email de Bienvenida a Membresía</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">Este email se envía cuando un usuario adquiere una membresía.</p>
                <Button onClick={() => sendTestEmail("welcome_membership")} disabled={loading !== null}>
                  {loading === "welcome_membership" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar email de prueba"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-medium text-blue-900 mb-2">📋 Instrucciones</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Esta herramienta simula el envío de emails para pruebas</p>
            <p>• Los emails se registran en el sistema pero no se envían realmente</p>
            <p>• Para enviar emails reales, configura las variables de entorno de tu proveedor de email</p>
            <p>• Puedes ver los logs de emails en el panel de administración</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
