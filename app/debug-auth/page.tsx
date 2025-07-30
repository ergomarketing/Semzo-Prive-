"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  created_at: string
  last_login?: string
}

export default function DebugAuthPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug-users")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error fetching users")
      }

      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug - Usuarios Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={fetchUsers} disabled={loading}>
              {loading ? "Cargando..." : "Actualizar Lista"}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700">Error: {error}</p>
              </div>
            )}

            {users.length === 0 && !loading && !error && <p className="text-gray-500">No hay usuarios registrados</p>}

            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Email:</strong> {user.email}
                    </div>
                    <div>
                      <strong>Nombre:</strong> {user.first_name} {user.last_name}
                    </div>
                    <div>
                      <strong>Teléfono:</strong> {user.phone || "N/A"}
                    </div>
                    <div>
                      <strong>Creado:</strong> {new Date(user.created_at).toLocaleString()}
                    </div>
                    <div>
                      <strong>Último login:</strong>{" "}
                      {user.last_login ? new Date(user.last_login).toLocaleString() : "Nunca"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
