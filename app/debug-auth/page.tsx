"use client"

import { useState } from "react"
import { supabase } from "../lib/supabase-direct"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugAuth() {
  const [authUsers, setAuthUsers] = useState<any[]>([])
  const [dbUsers, setDbUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const checkAuthUsers = async () => {
    setLoading(true)
    try {
      // Verificar usuarios en Auth
      const { data: session } = await supabase.auth.getSession()
      console.log("Current session:", session)

      // Verificar usuarios en la tabla
      const { data: users, error } = await supabase.from("users").select("*")

      if (error) {
        console.error("Error fetching users:", error)
      } else {
        setDbUsers(users || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    const email = prompt("Email para probar:")
    const password = prompt("Contraseña:")

    if (email && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        console.log("Login result:", { data, error })
        alert(`Login result: ${error ? error.message : "Success!"}`)
      } catch (error) {
        console.error("Login error:", error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Debug de Autenticación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Button onClick={checkAuthUsers} disabled={loading}>
                {loading ? "Cargando..." : "Verificar Usuarios"}
              </Button>
              <Button onClick={testLogin} variant="outline">
                Probar Login
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Usuarios en Base de Datos</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="text-sm overflow-auto">{JSON.stringify(dbUsers, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Información de Debug</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Total usuarios en DB:</strong> {dbUsers.length}
                  </p>
                  <p>
                    <strong>Supabase URL:</strong> https://qehractznaktxhyaqqen.supabase.co
                  </p>
                  <p>
                    <strong>Timestamp:</strong> {new Date().toISOString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
