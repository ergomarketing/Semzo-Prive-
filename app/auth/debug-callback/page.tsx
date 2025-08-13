"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DebugCallback() {
  const searchParams = useSearchParams()
  const [allParams, setAllParams] = useState<Record<string, string>>({})

  useEffect(() => {
    const params: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }
    setAllParams(params)
    console.log("🔍 Parámetros en debug callback:", params)
  }, [searchParams])

  const handleTestCallback = async () => {
    try {
      const url = new URL("/api/auth/callback", window.location.origin)
      for (const [key, value] of Object.entries(allParams)) {
        url.searchParams.set(key, value)
      }

      console.log("🔄 Probando callback con URL:", url.toString())
      window.location.href = url.toString()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Debug Callback</CardTitle>
          <CardDescription>Diagnóstico de parámetros de callback</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Parámetros recibidos:</h3>
            {Object.keys(allParams).length === 0 ? (
              <p className="text-gray-500">No hay parámetros</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(allParams).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Badge variant="outline">{key}</Badge>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {value.length > 50 ? value.substring(0, 50) + "..." : value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Análisis:</h3>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Token Hash:</strong>{" "}
                <Badge variant={allParams.token_hash ? "default" : "destructive"}>
                  {allParams.token_hash ? "Presente" : "Ausente"}
                </Badge>
              </p>
              <p>
                <strong>Type:</strong>{" "}
                <Badge variant={allParams.type ? "default" : "destructive"}>{allParams.type || "Ausente"}</Badge>
              </p>
              <p>
                <strong>Error:</strong>{" "}
                <Badge variant={allParams.error ? "destructive" : "default"}>{allParams.error || "No hay error"}</Badge>
              </p>
            </div>
          </div>

          {Object.keys(allParams).length > 0 && (
            <Button onClick={handleTestCallback} className="w-full">
              Probar Callback
            </Button>
          )}

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">URL actual: {window.location.href}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
