'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react'

export default function ErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('')

  useEffect(() => {
    const errorMessage = searchParams.get('message')
    
    switch (errorMessage) {
      case 'invalid_params':
        setMessage('El enlace de confirmación no es válido o ha expirado.')
        break
      case 'user_not_found':
        setMessage('No se encontró el usuario. Es posible que el enlace haya expirado.')
        break
      case 'confirmation_failed':
        setMessage('No se pudo confirmar el email. Inténtalo de nuevo.')
        break
      case 'invalid_token':
        setMessage('El token de confirmación no es válido.')
        break
      case 'server_error':
        setMessage('Error interno del servidor. Inténtalo más tarde.')
        break
      default:
        setMessage('Hubo un problema al confirmar tu email.')
    }
  }, [searchParams])

  const handleGoBack = () => {
    router.push('/')
  }

  const handleContactSupport = () => {
    router.push('/support')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Error de Confirmación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              {message}
            </p>
            <p className="text-sm text-gray-500">
              Si el problema persiste, contacta a nuestro equipo de soporte.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleGoBack}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Volver al Inicio
            </Button>
            
            <Button 
              onClick={handleContactSupport}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Mail className="mr-2 w-4 h-4" />
              Contactar Soporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
