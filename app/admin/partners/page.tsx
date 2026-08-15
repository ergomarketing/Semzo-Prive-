"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Handshake,
  Wallet,
  Clock,
  RefreshCw,
  Loader2,
  Plus,
  Pencil,
  CheckCircle2,
  Building2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const colors = { primary: "#1a2c4e", accent: "#d4a5a5" }

const PARTNER_TYPE_LABELS: Record<string, string> = {
  villa: "Villa",
  hotel: "Hotel",
  wedding_planner: "Wedding Planner",
  concierge: "Concierge",
  other: "Otro",
}

interface PartnerTotals {
  payable: number
  paid: number
  count: number
}
interface Partner {
  id: string
  business_name: string
  partner_type: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  code: string
  commission_rate: number
  iban: string | null
  notes: string | null
  status: "active" | "inactive"
  created_at: string
  totals: PartnerTotals
}
interface Commission {
  id: string
  partner_id: string
  reservation_id: string | null
  base_amount: number
  commission_rate: number
  commission_amount: number
  status: "pending" | "completed" | "rejected"
  source: "rental" | "membership"
  paid_at: string | null
  paid_reference: string | null
  created_at: string
  partners: { business_name: string; code: string } | null
}

const emptyForm = {
  id: "",
  business_name: "",
  partner_type: "villa",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  code: "",
  commission_rate: "15",
  iban: "",
  notes: "",
  status: "active" as "active" | "inactive",
}

export default function AdminPartnersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState<Partner[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/partners"),
        fetch("/api/admin/partners/commissions"),
      ])
      const pData = await pRes.json()
      const cData = await cRes.json()
      if (!pRes.ok) throw new Error(pData?.error || "Error cargando partners")
      setPartners(pData.partners || [])
      setCommissions(cData.commissions || [])
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Error cargando datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const totals = useMemo(() => {
    let payable = 0
    let paid = 0
    for (const p of partners) {
      payable += p.totals.payable
      paid += p.totals.paid
    }
    return { payable, paid, activePartners: partners.filter((p) => p.status === "active").length }
  }, [partners])

  const openCreate = () => {
    setForm(emptyForm)
    setDialogOpen(true)
  }
  const openEdit = (p: Partner) => {
    setForm({
      id: p.id,
      business_name: p.business_name,
      partner_type: p.partner_type,
      contact_name: p.contact_name || "",
      contact_email: p.contact_email || "",
      contact_phone: p.contact_phone || "",
      code: p.code,
      commission_rate: String(Math.round(p.commission_rate * 100)),
      iban: p.iban || "",
      notes: p.notes || "",
      status: p.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const ratePct = Number(form.commission_rate)
      if (!Number.isFinite(ratePct) || ratePct < 0 || ratePct > 100) {
        throw new Error("La comisión debe estar entre 0 y 100%")
      }
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        business_name: form.business_name,
        partner_type: form.partner_type,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        code: form.code,
        commission_rate: ratePct / 100,
        iban: form.iban,
        notes: form.notes,
        status: form.status,
      }
      const res = await fetch("/api/admin/partners", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error al guardar")
      toast({ description: form.id ? "Partner actualizado" : "Partner creado" })
      setDialogOpen(false)
      await fetchAll()
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Error al guardar",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePay = async (c: Commission) => {
    const reference = window.prompt(
      `Marcar como PAGADA la comisión de ${c.commission_amount}€ a ${c.partners?.business_name}?\n\nReferencia de la transferencia (opcional):`,
      "",
    )
    if (reference === null) return
    setActionId(c.id)
    try {
      const res = await fetch("/api/admin/partners/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, action: "pay", paid_reference: reference }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error")
      toast({ description: "Comisión marcada como pagada" })
      await fetchAll()
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      })
    } finally {
      setActionId(null)
    }
  }

  const fmt = (n: number) => `${(Number(n) || 0).toFixed(2)}€`

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>
            Partners
          </h1>
          <p className="text-muted-foreground mt-1">
            Villas, hoteles, wedding planners y concierge. Comisión por cada cliente referido.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAll} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={openCreate} style={{ backgroundColor: colors.primary, color: "white" }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo partner
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Partners activos</p>
              <p className="text-3xl font-bold mt-1" style={{ color: colors.primary }}>
                {totals.activePartners}
              </p>
            </div>
            <Building2 className="h-10 w-10" style={{ color: colors.primary, opacity: 0.3 }} />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendiente de pago</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "#92400e" }}>
                {fmt(totals.payable)}
              </p>
            </div>
            <Clock className="h-10 w-10" style={{ color: "#92400e", opacity: 0.3 }} />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total pagado</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "#065f46" }}>
                {fmt(totals.paid)}
              </p>
            </div>
            <Wallet className="h-10 w-10" style={{ color: "#065f46", opacity: 0.3 }} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="commissions">Comisiones</TabsTrigger>
        </TabsList>

        {/* TAB partners */}
        <TabsContent value="partners">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle style={{ color: colors.primary }}>Partners registrados</CardTitle>
              <CardDescription>Cada partner tiene un código único reutilizable</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
                </div>
              ) : partners.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Handshake className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>Todavía no hay partners. Crea el primero.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Negocio</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead className="text-right">Comisión</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="font-medium">{p.business_name}</div>
                            <div className="text-xs text-muted-foreground">{p.contact_email || "-"}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {PARTNER_TYPE_LABELS[p.partner_type] || p.partner_type}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{p.code}</code>
                          </TableCell>
                          <TableCell className="text-right">{Math.round(p.commission_rate * 100)}%</TableCell>
                          <TableCell className="text-right font-medium" style={{ color: "#92400e" }}>
                            {fmt(p.totals.payable)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {fmt(p.totals.paid)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              style={
                                p.status === "active"
                                  ? { backgroundColor: "#d1fae5", color: "#065f46" }
                                  : { backgroundColor: "#e5e7eb", color: "#374151" }
                              }
                            >
                              {p.status === "active" ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB comisiones */}
        <TabsContent value="commissions">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle style={{ color: colors.primary }}>Comisiones</CardTitle>
              <CardDescription>
                Solo las comisiones completadas (bolso devuelto / membresía activa) se pueden liquidar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
                </div>
              ) : commissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>Todavía no hay comisiones registradas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">Comisión</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((c) => {
                        const isPaid = !!c.paid_at
                        const statusCfg = isPaid
                          ? { label: "Pagada", bg: "#d1fae5", fg: "#065f46" }
                          : c.status === "completed"
                            ? { label: "Liquidable", bg: "#dbeafe", fg: "#1e3a8a" }
                            : c.status === "rejected"
                              ? { label: "Rechazada", bg: "#fee2e2", fg: "#991b1b" }
                              : { label: "Pendiente", bg: "#fef3c7", fg: "#92400e" }
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="text-sm whitespace-nowrap">
                              {new Date(c.created_at).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{c.partners?.business_name || "-"}</div>
                              <code className="text-xs text-muted-foreground">{c.partners?.code}</code>
                            </TableCell>
                            <TableCell className="text-sm">
                              {c.source === "membership" ? "Membresía" : "Alquiler"}
                            </TableCell>
                            <TableCell className="text-right">{fmt(c.base_amount)}</TableCell>
                            <TableCell className="text-right font-medium">{fmt(c.commission_amount)}</TableCell>
                            <TableCell>
                              <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.fg }}>
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {c.status === "completed" && !isPaid && (
                                <Button
                                  size="sm"
                                  disabled={actionId === c.id}
                                  onClick={() => handlePay(c)}
                                  style={{ backgroundColor: colors.primary, color: "white" }}
                                >
                                  {actionId === c.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Marcar pagada
                                    </>
                                  )}
                                </Button>
                              )}
                              {isPaid && c.paid_reference && (
                                <span className="text-xs text-muted-foreground">Ref: {c.paid_reference}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog crear/editar partner */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar partner" : "Nuevo partner"}</DialogTitle>
            <DialogDescription>
              El código es único y reutilizable. El cliente no recibe descuento; solo se atribuye la venta.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="business_name">Nombre del negocio *</Label>
              <Input
                id="business_name"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                placeholder="Marbella Club Hotel"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select
                  value={form.partner_type}
                  onValueChange={(v) => setForm({ ...form, partner_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PARTNER_TYPE_LABELS).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="MARBELLACLUB"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="commission_rate">Comisión (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_name">Persona de contacto</Label>
              <Input
                id="contact_name"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_phone">Teléfono</Label>
                <Input
                  id="contact_phone"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="iban">IBAN (para liquidar comisión)</Label>
              <Input
                id="iban"
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                placeholder="ES.."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: colors.primary, color: "white" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {form.id ? "Guardar cambios" : "Crear partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
