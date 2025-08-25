"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("message") || "Error desconocido"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Error de Autenticación</CardTitle>
          <CardDescription>Hubo un problema con tu autenticación</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/login">Volver al Login</Link>
            </Button>

            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/signup">Crear Nueva Cuenta</Link>
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p>Si el problema persiste, contacta soporte.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
