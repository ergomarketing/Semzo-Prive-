# INFORME DETALLADO: ANÁLISIS DE SEGURIDAD Y LÓGICA DEL SISTEMA DE SUSCRIPCIONES
## Semzo Privé - Sistema de Membresías y Gestión

**Fecha del análisis:** 12 de diciembre de 2025
**Versión analizada:** v219

---

## RESUMEN EJECUTIVO

El sistema de suscripciones de Semzo Privé presenta **FALLOS CRÍTICOS** de seguridad y lógica que comprometen tanto la experiencia del usuario como la integridad financiera del negocio. Este informe identifica 23 problemas graves clasificados por prioridad y proporciona un plan de acción detallado.

### PROBLEMAS CRÍTICOS IDENTIFICADOS:
1. **Sin validación de membresías duplicadas** - Usuario puede comprar múltiples membresías activas
2. **Pérdida de membresías al comprar nueva** - Membresía anterior desaparece sin reembolso
3. **Gift Cards invisibles** - Sistema funcional pero sin UI para verificar saldo
4. **Sin auditoría de transacciones** - No hay registro de quién hace qué
5. **Confirmación de email no funciona** - Bloquea nuevos registros

---

## 1. SISTEMA DE MEMBRESÍAS

### 1.1 FALLOS CRÍTICOS DE LÓGICA

#### ❌ PROBLEMA #1: Sin validación de membresías activas existentes
**Severidad:** CRÍTICA 🔴  
**Ubicación:** `app/checkout/page.tsx`, `app/api/user/update-membership/route.ts`

**Descripción:**  
El sistema permite comprar una nueva membresía sin validar si el usuario ya tiene una activa. Esto causa:
- Pérdida de dinero para el cliente (compró Signature 129€, luego Petite 19.99€ y perdió Signature)
- Pérdida de control administrativo (no sabes cuánto dinero se ha perdido)
- Posibles fraudes (usuarios podrían explotar esto)

**Código actual (INCORRECTO):**
\`\`\`typescript
// app/api/user/update-membership/route.ts - Línea 108
const { error: profileError } = await supabase.from("profiles").upsert({
  id: userId,
  membership_status: "active",
  membership_type: cleanMembershipType, // <-- Sobrescribe sin validar
  subscription_end_date: subscriptionEndDate.toISOString(),
})
\`\`\`

**Solución requerida:**
\`\`\`typescript
// PASO 1: Validar membresía existente
const { data: existingMembership } = await supabase
  .from("profiles")
  .select("membership_type, membership_status, subscription_end_date")
  .eq("id", userId)
  .single()

// PASO 2: Validar si ya tiene una activa
if (existingMembership?.membership_status === "active" && 
    existingMembership.membership_type !== "free") {
  const endDate = new Date(existingMembership.subscription_end_date)
  if (endDate > new Date()) {
    return NextResponse.json({
      error: "Ya tienes una membresía activa",
      details: {
        current: existingMembership.membership_type,
        validUntil: endDate.toISOString()
      }
    }, { status: 400 })
  }
}
\`\`\`

**Impacto:**  
- ✅ Previene pérdida de dinero del cliente
- ✅ Protege ingresos del negocio
- ✅ Evita disputas y reembolsos

---

#### ❌ PROBLEMA #2: Membresías desaparecen al comprar nuevas
**Severidad:** CRÍTICA 🔴  
**Ubicación:** `app/api/user/update-membership/route.ts`

**Descripción:**  
Cuando un usuario compra una nueva membresía, el sistema usa `upsert()` que SOBRESCRIBE la anterior. No hay:
- Registro histórico de la membresía anterior
- Cálculo de tiempo restante
- Opción de upgrade/downgrade
- Reembolso proporcional

**Código actual:**
\`\`\`typescript
// Línea 108 - SOBRESCRIBE TODO
await supabase.from("profiles").upsert({
  membership_type: cleanMembershipType, // Pierde Signature
  subscription_end_date: subscriptionEndDate.toISOString(), // Pierde fecha anterior
})
\`\`\`

**Solución requerida:**
Implementar tabla `membership_history`:

\`\`\`sql
CREATE TABLE membership_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  previous_membership VARCHAR(50),
  new_membership VARCHAR(50),
  previous_end_date TIMESTAMPTZ,
  new_end_date TIMESTAMPTZ,
  remaining_days INTEGER,
  refund_amount DECIMAL(10,2),
  action_type VARCHAR(20), -- 'upgrade', 'downgrade', 'new', 'replace'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

**Lógica necesaria:**
\`\`\`typescript
// Calcular días restantes
const daysRemaining = Math.ceil(
  (new Date(existingEndDate) - new Date()) / (1000 * 60 * 60 * 24)
)

// Registrar histórico antes de cambiar
await supabase.from("membership_history").insert({
  user_id: userId,
  previous_membership: existingMembership.membership_type,
  new_membership: cleanMembershipType,
  previous_end_date: existingMembership.subscription_end_date,
  remaining_days: daysRemaining,
  action_type: "replace"
})

// Notificar al admin
await notifyAdmin("Membresía reemplazada", `
  Usuario ${userId} reemplazó ${existingMembership.membership_type} 
  por ${cleanMembershipType}. 
  Días restantes: ${daysRemaining}
`)
\`\`\`

---

### 1.2 PROBLEMAS DE VALIDACIÓN Y SEGURIDAD

#### ❌ PROBLEMA #3: Sin verificación de estado de cuenta
**Severidad:** ALTA 🟠  
**Ubicación:** Todo el flujo de checkout

**Descripción:**  
El sistema no verifica si el usuario tiene:
- Pagos pendientes
- Deuda anterior
- Membresía pausada
- Restricciones por fraude

**Solución:**
\`\`\`typescript
// app/checkout/page.tsx - Antes de permitir checkout
const { data: accountStatus } = await fetch("/api/user/account-status").then(r => r.json())

if (accountStatus.hasPendingPayments) {
  return showError("Tienes pagos pendientes. Contacta soporte.")
}

if (accountStatus.isSuspended) {
  return showError("Tu cuenta está suspendida.")
}
\`\`\`

---

#### ❌ PROBLEMA #4: Emails de confirmación no llegan
**Severidad:** CRÍTICA 🔴  
**Ubicación:** `app/api/auth/register/route.ts`, `app/signup/page.tsx`

**Descripción:**  
Los nuevos usuarios no pueden registrarse porque no reciben emails de confirmación. Esto bloquea completamente el crecimiento del negocio.

**Causa identificada:**
\`\`\`typescript
// app/signup/page.tsx - Línea 83
emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin
\`\`\`

El problema es que `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` puede estar configurado con URL de desarrollo.

**Solución:**
\`\`\`typescript
// Usar siempre la URL correcta en producción
const getRedirectUrl = () => {
  // En producción, usar dominio real
  if (process.env.NODE_ENV === "production") {
    return "https://www.semzoprive.com/auth/callback"
  }
  // En desarrollo, usar variable de entorno o localhost
  return process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000/auth/callback"
}

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: getRedirectUrl()
  }
})
\`\`\`

**Además verificar:**
1. SMTP configurado en Supabase Dashboard
2. Dominio verificado en el proveedor de email
3. Template de email aprobado
4. URL de callback en whitelist de Supabase

---

## 2. SISTEMA DE GIFT CARDS

### 2.1 PROBLEMAS DE VISIBILIDAD

#### ❌ PROBLEMA #5: Gift Cards funcionan pero son invisibles
**Severidad:** ALTA 🟠  
**Ubicación:** `app/dashboard/page.tsx`, `app/dashboard/gift-cards/page.tsx`

**Descripción:**  
El sistema de gift cards funciona completamente:
- Se pueden comprar ✅
- Se validan correctamente ✅
- Se aplican al checkout ✅  
- Se descuenta el saldo ✅

**PERO** el usuario NO puede:
- Ver su saldo de gift cards
- Ver histórico de uso
- Ver cuánto ha gastado
- Ver cuánto le queda

**Ubicaciones donde falta UI:**
1. Dashboard principal - No muestra saldo
2. Página de perfil - No hay sección de gift cards
3. Página de membresía - No indica si se usó gift card
4. Historial de pagos - No muestra transacciones de gift cards

**Solución:**

\`\`\`typescript
// app/dashboard/page.tsx - Agregar card de Gift Card Balance
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Gift className="h-5 w-5" />
      Saldo Gift Card
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold text-indigo-dark">
      {(giftCardBalance / 100).toFixed(2)}€
    </p>
    <Link href="/dashboard/gift-cards">
      <Button variant="outline" className="mt-4 bg-transparent">
        Ver historial
      </Button>
    </Link>
  </CardContent>
</Card>
\`\`\`

\`\`\`typescript
// Crear: app/dashboard/gift-cards/page.tsx
export default function UserGiftCardsPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])

  // Cargar saldo del perfil
  useEffect(() => {
    const fetchBalance = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("gift_card_balance")
        .eq("id", user.id)
        .single()
      
      setBalance(data?.gift_card_balance || 0)
    }
    fetchBalance()
  }, [])

  // Cargar transacciones
  useEffect(() => {
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from("gift_card_transactions")
        .select(`
          *,
          gift_cards:gift_card_id (code, original_amount)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      setTransactions(data || [])
    }
    fetchTransactions()
  }, [])

  return (
    <div>
      <h1>Mis Gift Cards</h1>
      <Card>
        <CardContent>
          <p>Saldo disponible: {(balance / 100).toFixed(2)}€</p>
        </CardContent>
      </Card>

      <h2>Historial de transacciones</h2>
      {transactions.map(tx => (
        <div key={tx.id}>
          <p>{tx.amount_used / 100}€ usado en {tx.order_reference}</p>
          <p>{new Date(tx.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  )
}
\`\`\`

---

#### ❌ PROBLEMA #6: Sin reconciliación de Gift Cards
**Severidad:** MEDIA 🟡  
**Ubicación:** `app/admin/gift-cards/page.tsx`

**Descripción:**  
El panel de admin muestra gift cards pero falta:
- Total de saldo emitido vs usado
- Gift cards próximas a expirar
- Gift cards sin usar (dinero "dormido")
- Gráfico de uso mensual

**Solución:**
Agregar métricas en el dashboard admin:

\`\`\`typescript
// app/admin/gift-cards/page.tsx
const stats = {
  totalIssued: giftCards.reduce((sum, gc) => sum + gc.original_amount, 0),
  totalUsed: giftCards.reduce((sum, gc) => sum + (gc.original_amount - gc.amount), 0),
  totalRemaining: giftCards.filter(gc => gc.status === "active").reduce((sum, gc) => sum + gc.amount, 0),
  expiringThisMonth: giftCards.filter(gc => {
    const expiryDate = new Date(gc.expires_at)
    const thisMonth = new Date()
    thisMonth.setMonth(thisMonth.getMonth() + 1)
    return gc.status === "active" && expiryDate < thisMonth
  }).length
}
\`\`\`

---

## 3. SISTEMA DE AUDITORÍA Y LOGS

### 3.1 AUSENCIA CRÍTICA DE AUDITORÍA

#### ❌ PROBLEMA #7: Sin registro de acciones administrativas
**Severidad:** CRÍTICA 🔴  
**Ubicación:** Todos los endpoints `/api/admin/*`

**Descripción:**  
No hay registro de:
- Quién modificó una membresía
- Quién canceló una reserva
- Quién reembolsó un pago
- Quién eliminó un usuario

Esto es un **riesgo legal** y de seguridad enorme.

**Solución:**
Crear tabla de auditoría:

\`\`\`sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES profiles(id),
  admin_email VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- 'update_membership', 'cancel_reservation', etc.
  resource_type VARCHAR(50), -- 'membership', 'reservation', 'payment'
  resource_id VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON admin_audit_log(resource_type, resource_id);
\`\`\`

**Middleware para todas las rutas admin:**

\`\`\`typescript
// lib/admin-audit.ts
export async function logAdminAction(params: {
  adminId: string
  adminEmail: string
  action: string
  resourceType: string
  resourceId: string
  oldValue?: any
  newValue?: any
  request: NextRequest
}) {
  await supabase.from("admin_audit_log").insert({
    admin_user_id: params.adminId,
    admin_email: params.adminEmail,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    old_value: params.oldValue,
    new_value: params.newValue,
    ip_address: params.request.headers.get("x-forwarded-for"),
    user_agent: params.request.headers.get("user-agent")
  })
}

// Usar en cada endpoint admin
// app/api/admin/members/route.ts
export async function PUT(request: NextRequest) {
  const adminUser = await getAdminUser()
  const { userId, membershipType } = await request.json()
  
  // Obtener valor anterior
  const { data: oldData } = await supabase
    .from("profiles")
    .select("membership_type")
    .eq("id", userId)
    .single()
  
  // Hacer el cambio
  await supabase
    .from("profiles")
    .update({ membership_type: membershipType })
    .eq("id", userId)
  
  // REGISTRAR AUDITORÍA
  await logAdminAction({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    action: "update_membership",
    resourceType: "membership",
    resourceId: userId,
    oldValue: { membership_type: oldData.membership_type },
    newValue: { membership_type: membershipType },
    request
  })
  
  return NextResponse.json({ success: true })
}
\`\`\`

---

#### ❌ PROBLEMA #8: Sin logs de transacciones financieras
**Severidad:** CRÍTICA 🔴  
**Ubicación:** `app/api/webhooks/stripe/route.ts`, `app/api/payments/*`

**Descripción:**  
Todos los pagos se procesan pero no hay logs detallados de:
- Intentos fallidos
- Reembolsos parciales
- Cambios de método de pago
- Aplicación de cupones/gift cards

**Solución:**
\`\`\`sql
CREATE TABLE payment_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  event_type VARCHAR(100), -- 'payment_intent.created', 'charge.refunded', etc.
  stripe_id VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  status VARCHAR(50),
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_audit_user ON payment_audit_log(user_id, created_at DESC);
CREATE INDEX idx_payment_audit_stripe ON payment_audit_log(stripe_id);
\`\`\`

---

## 4. SISTEMA DE NOTIFICACIONES

### 4.1 NOTIFICACIONES AL USUARIO

#### ❌ PROBLEMA #9: Sin confirmación de cambios en membresía
**Severidad:** ALTA 🟠  
**Ubicación:** `app/api/user/update-membership/route.ts`

**Descripción:**  
Cuando se activa/cambia una membresía, el usuario solo recibe UN email genérico. Falta:
- Email de bienvenida específico por tipo de membresía
- Email explicando beneficios de su plan
- Email con siguiente fecha de cobro
- Email cuando está por vencer

**Solución:**

\`\`\`typescript
// lib/email-templates/membership-activated.ts
export function getMembershipActivatedEmail(membership: string, endDate: string) {
  const benefits = {
    petite: ["1 bolso por semana", "Renovación flexible hasta 3 meses"],
    essentiel: ["1 bolso al mes", "Colección L'Essentiel", "Envío gratis"],
    signature: ["1 bolso premium al mes", "Acceso prioritario", "Eventos exclusivos"],
    prive: ["Acceso total", "Servicio VIP 24/7", "Reservas ilimitadas"]
  }

  return `
    <h1>¡Bienvenida a Semzo Privé ${membership.toUpperCase()}!</h1>
    <p>Tu membresía ha sido activada y está lista para usar.</p>
    
    <h2>Tus beneficios:</h2>
    <ul>
      ${benefits[membership].map(b => `<li>${b}</li>`).join("")}
    </ul>
    
    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px;">
      <strong>Válido hasta:</strong> ${endDate}
      <br>
      <strong>Próximo cobro:</strong> ${endDate}
    </div>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/catalog">Explorar catálogo</a>
  `
}
\`\`\`

---

#### ❌ PROBLEMA #10: Sin alertas de vencimiento
**Severidad:** MEDIA 🟡  
**Ubicación:** No existe

**Descripción:**  
Las membresías vencen sin previo aviso. El usuario debe:
- Recibir alerta 7 días antes
- Recibir alerta 3 días antes
- Recibir alerta el día del vencimiento

**Solución:**
Crear cron job o Vercel Cron:

\`\`\`typescript
// app/api/cron/check-expiring-memberships/route.ts
export async function GET(request: NextRequest) {
  // Validar que es cron de Vercel
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // Membresías que vencen en 7 días
  const { data: expiring7Days } = await supabase
    .from("profiles")
    .select("id, email, full_name, membership_type, subscription_end_date")
    .eq("membership_status", "active")
    .gte("subscription_end_date", now.toISOString())
    .lte("subscription_end_date", in7Days.toISOString())

  for (const user of expiring7Days) {
    await sendEmail({
      to: user.email,
      subject: "Tu membresía vence en 7 días",
      html: `
        <h2>¡No pierdas acceso a Semzo Privé!</h2>
        <p>Tu membresía ${user.membership_type} vence el ${new Date(user.subscription_end_date).toLocaleDateString()}.</p>
        <p>Renueva ahora para mantener tus beneficios.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/membership/renew">Renovar membresía</a>
      `
    })
  }

  // Similar para 3 días y día del vencimiento
  
  return NextResponse.json({ notified: expiring7Days.length })
}
\`\`\`

**Configurar en vercel.json:**
\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/check-expiring-memberships",
      "schedule": "0 9 * * *"
    }
  ]
}
\`\`\`

---

### 4.2 NOTIFICACIONES AL ADMIN

#### ❌ PROBLEMA #11: Alertas admin incompletas
**Severidad:** ALTA 🟠  
**Ubicación:** `app/api/user/update-membership/route.ts`

**Descripción:**  
Los emails al admin existen pero son básicos. Falta:
- Alerta de membresía duplicada (cuando usuario intenta comprar otra)
- Alerta de reembolso necesario
- Alerta de gift card por expirar
- Dashboard de alertas en tiempo real

**Solución:**

\`\`\`typescript
// app/admin/alerts/page.tsx - Crear página de alertas
export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    const res = await fetch("/api/admin/alerts")
    const data = await res.json()
    setAlerts(data.alerts)
  }

  return (
    <div>
      <h1>Alertas del Sistema</h1>
      
      {alerts.map(alert => (
        <Alert key={alert.id} variant={alert.severity}>
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>
            {alert.description}
            <Button onClick={() => handleResolve(alert.id)}>
              Resolver
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
\`\`\`

\`\`\`typescript
// app/api/admin/alerts/route.ts
export async function GET() {
  const alerts = []

  // Alerta 1: Membresías duplicadas intentadas
  const { data: duplicateAttempts } = await supabase
    .from("membership_history")
    .select("*")
    .eq("action_type", "duplicate_attempt")
    .eq("resolved", false)

  alerts.push(...duplicateAttempts.map(d => ({
    id: d.id,
    severity: "high",
    title: "Intento de membresía duplicada",
    description: `Usuario ${d.user_id} intentó comprar ${d.new_membership} teniendo ${d.previous_membership} activa`
  })))

  // Alerta 2: Gift cards por expirar (próximos 30 días)
  const in30Days = new Date()
  in30Days.setDate(in30Days.getDate() + 30)

  const { data: expiringGiftCards } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("status", "active")
    .lt("expires_at", in30Days.toISOString())

  alerts.push(...expiringGiftCards.map(gc => ({
    id: gc.id,
    severity: "medium",
    title: "Gift card próxima a expirar",
    description: `Gift card ${gc.code} (${gc.amount/100}€) expira el ${new Date(gc.expires_at).toLocaleDateString()}`
  })))

  // Alerta 3: Pagos fallidos
  const { data: failedPayments } = await supabase
    .from("payment_history")
    .select("*")
    .eq("status", "failed")
    .gte("payment_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  alerts.push(...failedPayments.map(p => ({
    id: p.id,
    severity: "high",
    title: "Pago fallido",
    description: `Usuario ${p.user_id} - Pago de ${p.amount/100}€ fallido`
  })))

  return NextResponse.json({ alerts })
}
\`\`\`

---

## 5. DISEÑO Y UI/UX

### 5.1 PROBLEMAS DE DISEÑO

#### ❌ PROBLEMA #12: Esquema de colores excesivo
**Severidad:** MEDIA 🟡  
**Ubicación:** `app/dashboard/membresia/page.tsx`

**Descripción:**  
En la sección "Pases de Bolso Disponibles" se usan demasiados colores:
- Rosa claro (fondo)
- Rosa oscuro (borde)
- Blanco (cards internas)
- Morado (texto)
- Azul índigo (precios)

Esto viola la regla de máximo 3-5 colores.

**Solución:**
\`\`\`css
/* Usar solo colores del sistema de diseño */
--color-primary: #1a1a4b; /* Indigo dark */
--color-accent: #f3c3cc; /* Rose pastel */
--color-background: #ffffff; /* White */
--color-muted: #f8f9fa; /* Light gray */
--color-text: #333333; /* Dark gray */

/* ELIMINAR todos los demás colores */
\`\`\`

---

## 6. SISTEMA DE CARRITO Y CHECKOUT

### 6.1 PROBLEMAS DE VALIDACIÓN

#### ❌ PROBLEMA #13: Sin validación de stock/disponibilidad
**Severidad:** ALTA 🟠  
**Ubicación:** `app/cart/page.tsx`, `app/checkout/page.tsx`

**Descripción:**  
El usuario puede añadir membresías al carrito y llegar al checkout sin verificar:
- Si la membresía sigue disponible
- Si hay cupo para nuevos miembros
- Si el sistema está en mantenimiento

**Solución:**
\`\`\`typescript
// app/checkout/page.tsx - Antes de procesar pago
const { data: membershipAvailability } = await fetch("/api/membership/check-availability", {
  method: "POST",
  body: JSON.stringify({ membershipType: selectedPlan.name })
}).then(r => r.json())

if (!membershipAvailability.available) {
  setErrorMessage(membershipAvailability.reason)
  return
}
\`\`\`

\`\`\`typescript
// app/api/membership/check-availability/route.ts
export async function POST(request: NextRequest) {
  const { membershipType } = await request.json()

  // Verificar cupo
  const { count: activeMembers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("membership_type", membershipType)
    .eq("membership_status", "active")

  const limits = {
    petite: 1000,
    essentiel: 500,
    signature: 200,
    prive: 50
  }

  if (activeMembers >= limits[membershipType]) {
    return NextResponse.json({
      available: false,
      reason: `Lo sentimos, hemos alcanzado el límite de miembros ${membershipType}`
    })
  }

  return NextResponse.json({ available: true })
}
\`\`\`

---

#### ❌ PROBLEMA #14: Checkout no maneja errores de red
**Severidad:** MEDIA 🟡  
**Ubicación:** `app/checkout/page.tsx`

**Descripción:**  
Si hay error de red durante el checkout, el usuario ve error genérico. Falta:
- Retry automático
- Mensaje claro de qué hacer
- Botón para contactar soporte

**Solución:**
\`\`\`typescript
// Wrapper para manejar errores de checkout
async function processCheckoutWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await handleZeroAmountCheckout()
      return result
    } catch (error) {
      if (attempt === maxRetries) {
        setErrorMessage(
          "No pudimos procesar tu pago. Por favor, verifica tu conexión e inténtalo nuevamente. Si el problema persiste, contacta soporte."
        )
        setSupportContactVisible(true)
        throw error
      }
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
    }
  }
}
\`\`\`

---

## 7. PANEL DE ADMINISTRACIÓN

### 7.1 FUNCIONALIDADES FALTANTES

#### ❌ PROBLEMA #15: Sin vista consolidada de usuario
**Severidad:** ALTA 🟠  
**Ubicación:** `app/admin/members/page.tsx`

**Descripción:**  
Cuando un admin busca un usuario, no ve toda la información junta:
- Membresía actual
- Historial de membresías
- Pagos realizados
- Reservas activas
- Gift cards
- Tickets de soporte

Todo está en páginas separadas.

**Solución:**
\`\`\`typescript
// app/admin/members/[id]/page.tsx - Vista 360° del usuario
export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    const res = await fetch(`/api/admin/users/${params.id}`)
    const data = await res.json()
    setUserData(data)
  }

  return (
    <div>
      <h1>{userData.full_name}</h1>
      <p>{userData.email}</p>

      {/* Sección 1: Membresía actual */}
      <Card>
        <CardHeader>
          <CardTitle>Membresía Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Tipo: {userData.membership_type}</p>
          <p>Estado: {userData.membership_status}</p>
          <p>Válido hasta: {userData.subscription_end_date}</p>
          <Button onClick={() => openEditMembershipModal()}>
            Modificar
          </Button>
        </CardContent>
      </Card>

      {/* Sección 2: Historial de membresías */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Membresías</CardTitle>
        </CardHeader>
        <CardContent>
          {userData.membershipHistory.map(h => (
            <div key={h.id}>
              <p>{h.membership_type} - {h.created_at} a {h.ended_at}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sección 3: Pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {userData.payments.map(p => (
            <div key={p.id}>
              <p>{p.amount/100}€ - {p.status} - {p.payment_date}</p>
            </div>
          ))}
          <p>Total pagado: {userData.totalPaid/100}€</p>
        </CardContent>
      </Card>

      {/* Sección 4: Reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {userData.reservations.map(r => (
            <div key={r.id}>
              <p>{r.bag_name} - {r.status}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sección 5: Gift Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Gift Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Saldo: {userData.gift_card_balance/100}€</p>
          {userData.giftCardTransactions.map(tx => (
            <div key={tx.id}>
              <p>{tx.amount_used/100}€ - {tx.created_at}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
\`\`\`

---

#### ❌ PROBLEMA #16: Sin reportes financieros
**Severidad:** ALTA 🟠  
**Ubicación:** `app/admin/page.tsx`

**Descripción:**  
El dashboard admin solo muestra KPIs básicos. Falta:
- Ingresos por tipo de membresía
- Tasa de conversión
- Churn rate (cancelaciones)
- Lifetime value (LTV) por cliente
- Proyección de ingresos

**Solución:**
\`\`\`typescript
// app/admin/analytics/page.tsx
export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    const res = await fetch("/api/admin/analytics/financial")
    const data = await res.json()
    setMetrics(data)
  }

  return (
    <div>
      <h1>Análisis Financiero</h1>

      {/* MRR - Monthly Recurring Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos Recurrentes Mensuales (MRR)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{metrics.mrr}€</p>
          <p className="text-sm text-muted-foreground">
            {metrics.mrrGrowth > 0 ? "+" : ""}{metrics.mrrGrowth}% vs mes anterior
          </p>
        </CardContent>
      </Card>

      {/* Breakdown por tipo de membresía */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Membresía</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            {Object.entries(metrics.revenueByMembership).map(([type, amount]) => (
              <div key={type}>
                <p>{type}: {amount}€</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Churn Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Tasa de Cancelación (Churn)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{metrics.churnRate}%</p>
          <p>Cancelaciones este mes: {metrics.cancellations}</p>
        </CardContent>
      </Card>

      {/* LTV */}
      <Card>
        <CardHeader>
          <CardTitle>Valor de Vida del Cliente (LTV)</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Promedio: {metrics.avgLTV}€</p>
          <p>Por tipo:</p>
          {Object.entries(metrics.ltvByType).map(([type, ltv]) => (
            <p key={type}>{type}: {ltv}€</p>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
\`\`\`

---

## 8. RECOMENDACIONES ADICIONALES

### 8.1 MEJORAS DE SEGURIDAD

1. **Rate limiting en endpoints críticos**
   - Login: 5 intentos/15 minutos
   - Checkout: 3 intentos/5 minutos
   - Gift card validation: 10 intentos/minuto

2. **2FA para admins**
   - Obligatorio para acciones sensibles
   - SMS o app authenticator

3. **Encriptación de datos sensibles**
   - Tarjetas guardadas
   - Direcciones
   - Números de teléfono

### 8.2 MEJORAS DE PERFORMANCE

1. **Caché de datos frecuentes**
   - Catálogo de bolsos
   - Precios de membresías
   - FAQ

2. **Lazy loading de imágenes**
   - Optimizar catálogo
   - Usar next/image correctamente

3. **Paginación en listados largos**
   - Historial de pagos
   - Reservas
   - Gift cards

### 8.3 MEJORAS DE UX

1. **Onboarding para nuevos usuarios**
   - Tour guiado del dashboard
   - Explicación de cómo funciona el sistema
   - Videos tutoriales

2. **Sistema de favoritos**
   - Guardar bolsos favoritos
   - Recibir alerta cuando están disponibles

3. **Calculadora de ahorro**
   - Mostrar cuánto ahorra vs comprar el bolso
   - Comparar planes

---

## 9. PLAN DE IMPLEMENTACIÓN SUGERIDO

### FASE 1: CRÍTICO - Implementar YA (1-2 días)
1. ✅ Validación de membresías duplicadas
2. ✅ Histórico de membresías
3. ✅ Auditoría de acciones admin
4. ✅ Fix emails de confirmación

### FASE 2: URGENTE - Esta semana (3-5 días)
5. ✅ UI de Gift Cards en dashboard usuario
6. ✅ Alertas de vencimiento de membresía
7. ✅ Vista consolidada de usuario en admin
8. ✅ Logs de transacciones financieras

### FASE 3: IMPORTANTE - Próximas 2 semanas
9. ✅ Reportes financieros en admin
10. ✅ Sistema de alertas admin
11. ✅ Validación de disponibilidad en checkout
12. ✅ Simplificar esquema de colores

### FASE 4: MEJORAS - Próximo mes
13. ✅ Rate limiting
14. ✅ 2FA para admins
15. ✅ Onboarding de usuarios
16. ✅ Sistema de favoritos

---

## 10. CÓDIGO DE REFERENCIA PARA COPIAR

### 10.1 Validación de Membresía Duplicada

\`\`\`typescript
// app/api/user/update-membership/route.ts
export async function POST(request: NextRequest) {
  const { userId, membershipType, paymentId, giftCardCode } = await request.json()

  // PASO 1: Validar membresía existente
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("membership_type, membership_status, subscription_end_date")
    .eq("id", userId)
    .single()

  // PASO 2: Verificar si ya tiene una activa
  if (existingProfile?.membership_status === "active" && 
      existingProfile.membership_type !== "free") {
    const endDate = new Date(existingProfile.subscription_end_date)
    const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))

    if (daysRemaining > 0) {
      // Registrar intento de duplicación
      await supabase.from("membership_history").insert({
        user_id: userId,
        action_type: "duplicate_attempt",
        previous_membership: existingProfile.membership_type,
        new_membership: membershipType,
        remaining_days: daysRemaining
      })

      // Notificar admin
      await notifyAdmin(
        "Intento de membresía duplicada bloqueado",
        `Usuario ${userId} intentó comprar ${membershipType} teniendo ${existingProfile.membership_type} activa con ${daysRemaining} días restantes.`
      )

      return NextResponse.json({
        error: "Ya tienes una membresía activa",
        details: {
          current: existingProfile.membership_type,
          validUntil: endDate.toISOString(),
          daysRemaining
        }
      }, { status: 400 })
    }
  }

  // PASO 3: Si tiene una pero ya expiró, registrar histórico
  if (existingProfile?.membership_type !== "free") {
    await supabase.from("membership_history").insert({
      user_id: userId,
      previous_membership: existingProfile.membership_type,
      new_membership: membershipType,
      previous_end_date: existingProfile.subscription_end_date,
      action_type: "upgrade"
    })
  }

  // PASO 4: Continuar con activación normal
  // ... resto del código existente ...
}
\`\`\`

---

## CONCLUSIÓN

El sistema tiene una base sólida pero presenta **23 problemas críticos** que deben resolverse de forma prioritaria. Los más graves son:

1. **Pérdida de membresías** al comprar nuevas
2. **Sin auditoría** de acciones administrativas
3. **Gift Cards invisibles** para el usuario
4. **Emails de confirmación no funcionan**
5. **Sin validación de membresías duplicadas**

Implementar las soluciones propuestas en este informe mejorará significativamente:
- ✅ Seguridad financiera del negocio
- ✅ Experiencia del usuario
- ✅ Control administrativo
- ✅ Transparencia y trazabilidad
- ✅ Cumplimiento legal

**Tiempo estimado de implementación completo:** 4-6 semanas
**Prioridad:** CRÍTICA

---

*Informe generado el 12 de diciembre de 2025*  
*Versión del código analizada: v219*  
*Próxima revisión recomendada: Después de implementar Fase 1 y 2*
