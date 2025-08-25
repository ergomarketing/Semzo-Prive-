"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AuthError() {
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    // Obtener mensaje de error de la URL
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get("error")
    const errorDescription = urlParams.get("error_description")

    if (errorDescription) {
      setErrorMessage(decodeURIComponent(errorDescription))
    } else if (error) {
      setErrorMessage(error)
    } else {
      setErrorMessage("Ha ocurrido un error durante la autenticación")
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-red-600">Error de Autenticación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-red-600">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <p className="text-gray-600">{errorMessage}</p>

            <div className="space-y-2">
              <Button onClick={() => (window.location.href = "/auth/login")} className="w-full">
                Ir al Login
              </Button>
              <Button onClick={() => (window.location.href = "/signup")} variant="outline" className="w-full">
                Crear Nueva Cuenta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
