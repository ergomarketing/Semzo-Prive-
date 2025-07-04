'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
// ← Ruta corregida al supabase client. Ajusta si tu archivo está en otra carpeta.
import supabase from '../../../utils/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true) // true = login, false = registro
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        })
        if (signInError) throw signInError
        router.push('/dashboard')
      } else {
        // --- SIGNUP ---
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password,
        })
        if (signUpError) throw signUpError
        router.push('/verify-email')
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto py-10">
      <h2 className="text-center text-3xl font-bold mb-6">
        {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
      </h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <form className="space-y-6" onSubmit={handleAuth}>
        <div>
          <label htmlFor="email" className="sr-only">
            Correo electrónico
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Correo electrónico"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Contraseña
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
              onClick={() => setShowPassword(v => !v)}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-2"
        >
          {isLoading
            ? isLogin
              ? 'Iniciando sesión...'
              : 'Creando cuenta...'
            : isLogin
            ? 'Iniciar sesión'
            : 'Registrarse'}
        </Button>
      </form>
      <div className="text-center mt-4">
        <button
          onClick={() => setIsLogin(v => !v)}
          className="text-sm text-indigo-600 hover:underline"
        >
          {isLogin
            ? '¿No tienes cuenta? Regístrate'
            : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  )
}
