'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function ConfirmedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/auth/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleGoToLogin = () => {
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            ¡Email Confirmado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              Tu cuenta ha sido confirmada exitosamente.
            </p>
            <p className="text-sm text-gray-500">
              Ya puedes iniciar sesión y acceder a tu dashboard personalizado.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleGoToLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Iniciar Sesión
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            
            <p className="text-xs text-gray-400">
              Redirigiendo automáticamente en {countdown} segundos...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
