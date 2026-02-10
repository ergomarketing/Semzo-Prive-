"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface GiftCard {
  id: string
  code: string
  amount: number
  original_amount: number
  status: string
  expires_at: string | null
  created_at: string
  transactions: Array<{
    amount: number
    created_at: string
    order_reference: string
  }>
}

export default function UserGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGiftCards()
  }, [])

  const fetchGiftCards = async () => {
    try {
      const res = await fetch("/api/user/gift-cards")
      if (res.ok) {
        const data = await res.json()
        setGiftCards(data.giftCards || [])
      }
    } catch (error) {
      console.error("Error fetching gift cards:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Código copiado")
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Activa" },
      used: { variant: "secondary", label: "Usada" },
      expired: { variant: "destructive", label: "Expirada" },
    }
    const config = badges[status] || { variant: "outline", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const totalAvailable = giftCards.filter((gc) => gc.status === "active").reduce((sum, gc) => sum + gc.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#1a2c4e" }}>
            Mis Gift Cards
          </h1>
          <p className="text-muted-foreground">Consulta el saldo y transacciones de tus tarjetas regalo</p>
        </div>
      </div>

      <Card className="border-0 shadow-lg" style={{ backgroundColor: "#d4a5a5", color: "white" }}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Saldo total disponible</p>
              <p className="text-3xl font-bold">{(totalAvailable / 100).toFixed(2)}€</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {giftCards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No tienes Gift Cards</h3>
            <p className="text-muted-foreground">Tus tarjetas regalo aparecerán aquí una vez las recibas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {giftCards.map((card) => (
            <Card key={card.id} className="border-0 shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#d4a5a5" }}
                    >
                      <Gift className="h-5 w-5" style={{ color: "#1a2c4e" }} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{card.code}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyCode(card.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        {card.expires_at
                          ? `Expira: ${new Date(card.expires_at).toLocaleDateString("es-ES")}`
                          : "Sin fecha de expiración"}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(card.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor original</p>
                    <p className="text-lg font-semibold">{(card.original_amount / 100).toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo actual</p>
                    <p className="text-lg font-semibold" style={{ color: "#1a2c4e" }}>
                      {(card.amount / 100).toFixed(2)}€
                    </p>
                  </div>
                </div>

                {card.transactions && card.transactions.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Historial de uso</p>
                    <div className="space-y-2">
                      {card.transactions.map((tx, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString("es-ES")} - {tx.order_reference}
                          </span>
                          <span className="font-medium">-{(tx.amount / 100).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
