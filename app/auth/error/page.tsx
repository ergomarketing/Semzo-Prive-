"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">Error de Autenticación</CardTitle>
          <CardDescription>Ha ocurrido un problema con tu autenticación</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
              {errorDescription && <p className="text-sm text-red-600 mt-2">{errorDescription}</p>}
            </div>
          )}

          <p className="text-gray-600">Por favor, intenta nuevamente o contacta al soporte si el problema persiste.</p>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">Intentar de nuevo</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
