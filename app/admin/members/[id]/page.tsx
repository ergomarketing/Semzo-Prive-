"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminUserDetailPage() {
  const params = useParams()
  const supabase = createSupabaseBrowserClient()
  const [user, setUser] = useState<any>(null)
  const [membership, setMembership] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [params.id])

  const fetchUserData = async () => {
    try {
      const { data: userData } = await supabase.from("profiles").select("*").eq("id", params.id).single()

      setUser(userData)

      const { data: membershipData } = await supabase
        .from("user_memberships")
        .select("*")
        .eq("user_id", params.id)
        .single()

      setMembership(membershipData)

      const { data: historyData } = await supabase
        .from("membership_history")
        .select("*")
        .eq("user_id", params.id)
        .order("created_at", { ascending: false })

      setHistory(historyData || [])

      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", params.id)
        .order("created_at", { ascending: false })

      setPayments(paymentsData || [])

      const { data: reservationsData } = await supabase
        .from("reservations")
        .select("*, bags(*)")
        .eq("user_id", params.id)
        .order("created_at", { ascending: false })

      setReservations(reservationsData || [])
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (!user) return <div className="p-8">Usuario no encontrado</div>

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">{user.full_name}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de Membresía</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <Badge className="mt-1">{membership?.membership_type?.toUpperCase() || "FREE"}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge variant={membership?.status === "active" ? "default" : "secondary"} className="mt-1">
                {membership?.status || "inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Válida hasta</p>
              <p className="font-medium">
                {membership?.valid_until ? new Date(membership.valid_until).toLocaleDateString("es-ES") : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Método de pago</p>
              <p className="font-medium">{membership?.payment_method_verified ? "✓ Verificado" : "✗ Sin verificar"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="reservations">Reservas</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {history.map((h) => (
            <Card key={h.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {h.previous_membership} → {h.new_membership}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString("es-ES")}
                    </p>
                    <Badge className="mt-2">{h.action_type}</Badge>
                  </div>
                  {h.remaining_days > 0 && <span className="text-sm">Días restantes: {h.remaining_days}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{(p.amount / 100).toFixed(2)}€</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <Badge variant={p.status === "completed" ? "default" : "destructive"}>{p.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          {reservations.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{r.bags?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(r.start_date).toLocaleDateString("es-ES")} -{" "}
                      {new Date(r.end_date).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <Badge>{r.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
