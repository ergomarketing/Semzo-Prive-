"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Gift, Plus, Copy, Ban, Check, RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

interface GiftCard {
  id: string
  code: string
  amount: number
  original_amount: number
  status: string
  recipient_email: string | null
  recipient_name: string | null
  expires_at: string | null
  created_at: string
}

interface Stats {
  total: number
  active: number
  used: number
  pending: number
  totalValue: number
  remainingValue: number
}

const MEMBERSHIP_PRESETS = [
  { label: "Personalizado", value: "custom", pricePerMonth: 0 },
  { label: "Petite — 19,99 €/mes", value: "petite", pricePerMonth: 19.99 },
  { label: "L'Essentiel — 59 €/mes", value: "essentiel", pricePerMonth: 59 },
  { label: "Signature — 149 €/mes", value: "signature", pricePerMonth: 149 },
  { label: "Privé — 149 €/mes", value: "prive", pricePerMonth: 149 },
] as const

const DURATION_OPTIONS = [
  { label: "1 mes", value: 1 },
  { label: "3 meses", value: 3 },
  { label: "6 meses", value: 6 },
  { label: "12 meses", value: 12 },
]

export default function AdminGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [membershipPreset, setMembershipPreset] = useState<string>("custom")
  const [durationMonths, setDurationMonths] = useState<number>(1)
  const [newCard, setNewCard] = useState({
    amount: 59,
    recipientEmail: "",
    recipientName: "",
    note: "",
  })

  // Cuando cambia el preset de membresía, actualiza el importe calculado
  const handlePresetChange = (preset: string) => {
    setMembershipPreset(preset)
    const found = MEMBERSHIP_PRESETS.find((p) => p.value === preset)
    if (found && found.value !== "custom") {
      setNewCard((c) => ({ ...c, amount: parseFloat((found.pricePerMonth * durationMonths).toFixed(2)) }))
    }
  }

  const handleDurationChange = (months: number) => {
    setDurationMonths(months)
    const found = MEMBERSHIP_PRESETS.find((p) => p.value === membershipPreset)
    if (found && found.value !== "custom") {
      setNewCard((c) => ({ ...c, amount: parseFloat((found.pricePerMonth * months).toFixed(2)) }))
    }
  }

  const fetchGiftCards = async () => {
    try {
      const res = await fetch("/api/admin/gift-cards")
      const data = await res.json()
      setGiftCards(data.giftCards || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error("Error fetching gift cards:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGiftCards()
  }, [])

  const createGiftCard = async () => {
    setCreating(true)
    try {
      const preset = MEMBERSHIP_PRESETS.find((p) => p.value === membershipPreset)
      const membershipLabel = preset && preset.value !== "custom" ? preset.label.split("—")[0].trim() : undefined

      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCard,
          membershipLabel,
          durationMonths: membershipPreset !== "custom" ? durationMonths : undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Gift card creada: ${data.giftCard.code}`)
        setDialogOpen(false)
        setMembershipPreset("custom")
        setDurationMonths(1)
        setNewCard({ amount: 59, recipientEmail: "", recipientName: "", note: "" })
        fetchGiftCards()
      } else {
        toast.error("Error al crear gift card")
      }
    } catch (error) {
      toast.error("Error del servidor")
    } finally {
      setCreating(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active"
    try {
      const res = await fetch(`/api/admin/gift-cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        toast.success(`Gift card ${newStatus === "active" ? "activada" : "desactivada"}`)
        fetchGiftCards()
      }
    } catch (error) {
      toast.error("Error al actualizar")
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Código copiado")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activa</Badge>
      case "used":
        return <Badge className="bg-gray-100 text-gray-800">Usada</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "disabled":
        return <Badge className="bg-red-100 text-red-800">Desactivada</Badge>
      case "expired":
        return <Badge className="bg-orange-100 text-orange-800">Expirada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gift Cards</h1>
          <p className="text-muted-foreground">Gestiona las tarjetas regalo de Semzó Privé</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Gift Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Crear Gift Card
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">

              {/* Preset de membresía */}
              <div className="space-y-1.5">
                <Label>Tipo de membresía (preset)</Label>
                <Select value={membershipPreset} onValueChange={handlePresetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una membresía..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBERSHIP_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duración — solo cuando se elige un preset */}
              {membershipPreset !== "custom" && (
                <div className="space-y-1.5">
                  <Label>Duración del regalo</Label>
                  <div className="flex gap-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => handleDurationChange(d.value)}
                        className={`flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors ${
                          durationMonths === d.value
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Valor calculado / manual */}
              <div className="space-y-1.5">
                <Label>
                  Valor total (€)
                  {membershipPreset !== "custom" && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      calculado automáticamente
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={0.01}
                  value={newCard.amount}
                  onChange={(e) => setNewCard({ ...newCard, amount: Number(e.target.value) })}
                  readOnly={membershipPreset !== "custom"}
                  className={membershipPreset !== "custom" ? "bg-muted" : ""}
                />
              </div>

              <Separator />

              {/* Destinatario */}
              <div className="space-y-1.5">
                <Label>Nombre del destinatario</Label>
                <Input
                  value={newCard.recipientName}
                  onChange={(e) => setNewCard({ ...newCard, recipientName: e.target.value })}
                  placeholder="María García"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email del destinatario (opcional)</Label>
                <Input
                  type="email"
                  value={newCard.recipientEmail}
                  onChange={(e) => setNewCard({ ...newCard, recipientEmail: e.target.value })}
                  placeholder="maria@ejemplo.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mensaje personal (opcional)</Label>
                <Textarea
                  value={newCard.note}
                  onChange={(e) => setNewCard({ ...newCard, note: e.target.value })}
                  placeholder="Con todo el cariño del mundo..."
                  rows={2}
                />
              </div>

              <Button onClick={createGiftCard} disabled={creating} className="w-full">
                {creating ? "Generando código..." : "Crear Gift Card"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total creadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-sm text-muted-foreground">Activas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{(stats.totalValue / 100).toFixed(0)}€</div>
              <p className="text-sm text-muted-foreground">Valor total emitido</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-indigo-600">{(stats.remainingValue / 100).toFixed(0)}€</div>
              <p className="text-sm text-muted-foreground">Saldo pendiente</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de Gift Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Todas las Gift Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {giftCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay gift cards creadas aún</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Valor Original</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giftCards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{card.code}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyCode(card.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{(card.original_amount / 100).toFixed(2)}€</TableCell>
                    <TableCell className="font-medium">{(card.amount / 100).toFixed(2)}€</TableCell>
                    <TableCell>{getStatusBadge(card.status)}</TableCell>
                    <TableCell>{card.recipient_name || card.recipient_email || "-"}</TableCell>
                    <TableCell>
                      {card.expires_at ? new Date(card.expires_at).toLocaleDateString("es-ES") : "-"}
                    </TableCell>
                    <TableCell>
                      {(card.status === "active" || card.status === "disabled") && (
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(card.id, card.status)}>
                          {card.status === "active" ? (
                            <Ban className="h-4 w-4 text-red-500" />
                          ) : (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
