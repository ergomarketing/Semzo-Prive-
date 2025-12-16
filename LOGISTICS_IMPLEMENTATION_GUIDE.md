# Guía de Implementación del Módulo de Logística

## Introducción

Este documento proporciona instrucciones paso a paso para implementar completamente el módulo de logística en Semzo Prive, incluyendo la configuración de la base de datos y la integración con proveedores de logística.

---

## Fase 1: Configuración de la Base de Datos

### 1.1 Ejecutar el Script SQL

1. Accede a tu panel de Supabase: https://app.supabase.com
2. Selecciona tu proyecto "Semzo Prive"
3. Ve a la sección **SQL Editor**
4. Copia el contenido del archivo `/scripts/create_logistics_tables.sql`
5. Pega el contenido en el editor SQL
6. Haz clic en **Run** para ejecutar el script

**Tablas creadas:**
- `shipments` - Registro de envíos
- `shipment_events` - Eventos de seguimiento
- `returns` - Gestión de devoluciones
- `logistics_settings` - Configuración de transportistas
- `shipment_notifications` - Notificaciones a clientes
- `logistics_audit_log` - Registro de auditoría

### 1.2 Verificar Tablas

Después de ejecutar el script, verifica que todas las tablas se hayan creado correctamente:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%shipment%' OR table_name LIKE '%return%' OR table_name LIKE '%logistics%';
```

---

## Fase 2: Configuración de Variables de Entorno

### 2.1 Actualizar `.env.local`

Añade las siguientes variables de entorno para la configuración de transportistas:

```env
# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAILS=admin@semzoprive.com,admin2@semzoprive.com

# Logistics Configuration - DHL
DHL_API_KEY=your_dhl_api_key
DHL_ACCOUNT_NUMBER=your_dhl_account_number
DHL_WEBHOOK_SECRET=your_dhl_webhook_secret

# Logistics Configuration - FedEx
FEDEX_API_KEY=your_fedex_api_key
FEDEX_ACCOUNT_NUMBER=your_fedex_account_number
FEDEX_WEBHOOK_SECRET=your_fedex_webhook_secret

# Logistics Configuration - UPS
UPS_API_KEY=your_ups_api_key
UPS_ACCOUNT_NUMBER=your_ups_account_number
UPS_WEBHOOK_SECRET=your_ups_webhook_secret

# Logistics Configuration - Correos (Spain)
CORREOS_API_KEY=your_correos_api_key
CORREOS_ACCOUNT_NUMBER=your_correos_account_number

# Logistics Configuration - Glovo
GLOVO_API_KEY=your_glovo_api_key
GLOVO_ACCOUNT_NUMBER=your_glovo_account_number
```

---

## Fase 3: Pruebas del Módulo Base

### 3.1 Acceder al Panel de Logística

1. Inicia sesión en el panel de admin con una cuenta de administrador
2. En el sidebar, haz clic en **Logística** (nuevo menú)
3. Deberías ver el dashboard de logística con:
   - Estadísticas generales
   - Pestaña de Resumen
   - Pestaña de Envíos
   - Pestaña de Devoluciones
   - Pestaña de Configuración

### 3.2 Crear un Envío Manual

1. Ve a la pestaña **Envíos**
2. Haz clic en **Nuevo Envío**
3. Selecciona una reserva existente
4. Completa los datos:
   - Transportista (opcional por ahora)
   - Número de seguimiento (opcional)
   - Fecha estimada de entrega
   - Costo del envío
5. Haz clic en **Crear**

### 3.3 Probar API

Puedes probar los endpoints de la API usando curl o Postman:

```bash
# Obtener lista de envíos
curl -X GET "http://localhost:3000/api/admin/logistics/shipments"

# Crear un envío
curl -X POST "http://localhost:3000/api/admin/logistics/shipments" \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": "uuid-de-reserva",
    "carrier": "DHL",
    "tracking_number": "1234567890",
    "estimated_delivery": "2024-12-25T00:00:00Z",
    "cost": 15.50
  }'

# Obtener configuración de transportistas
curl -X GET "http://localhost:3000/api/admin/logistics/settings"
```

---

## Fase 4: Integración con Transportistas

### 4.1 Configurar DHL

#### Obtener Credenciales

1. Ve a https://developer.dhl.com
2. Crea una cuenta de desarrollador
3. Crea una aplicación
4. Obtén tu `API_KEY` y `ACCOUNT_NUMBER`

#### Configurar en Semzo Prive

1. Ve a **Logística → Configuración**
2. Haz clic en **Configurar Transportista**
3. Selecciona **DHL**
4. Ingresa:
   - API Key
   - Account Number
   - Servicio por defecto (ej: "express")
5. Haz clic en **Guardar**

#### Crear Archivo de Integración

Crea `/app/api/admin/logistics/integrations/dhl.ts`:

```typescript
import axios from "axios"

const DHL_API_URL = "https://api.dhl.com/v1"

export async function createDHLShipment(shipmentData: any) {
  const apiKey = process.env.DHL_API_KEY
  const accountNumber = process.env.DHL_ACCOUNT_NUMBER

  try {
    const response = await axios.post(
      `${DHL_API_URL}/shipments`,
      {
        // Mapear datos de Semzo a formato DHL
        // ...
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    )

    return response.data
  } catch (error) {
    console.error("DHL API Error:", error)
    throw error
  }
}

export async function trackDHLShipment(trackingNumber: string) {
  const apiKey = process.env.DHL_API_KEY

  try {
    const response = await axios.get(
      `${DHL_API_URL}/tracking?trackingNumber=${trackingNumber}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    return response.data
  } catch (error) {
    console.error("DHL Tracking Error:", error)
    throw error
  }
}
```

### 4.2 Configurar FedEx

Sigue el mismo proceso que con DHL:

1. Ve a https://developer.fedex.com
2. Obtén credenciales
3. Configura en el panel de admin
4. Crea archivo de integración en `/app/api/admin/logistics/integrations/fedex.ts`

### 4.3 Configurar UPS

1. Ve a https://www.ups.com/upsdeveloperkit
2. Obtén credenciales
3. Configura en el panel de admin
4. Crea archivo de integración en `/app/api/admin/logistics/integrations/ups.ts`

### 4.4 Configurar Correos (España)

1. Ve a https://www.correos.es/es/es/empresas/servicios-digitales/api
2. Obtén credenciales
3. Configura en el panel de admin
4. Crea archivo de integración en `/app/api/admin/logistics/integrations/correos.ts`

### 4.5 Configurar Glovo

1. Ve a https://developer.glovoapp.com
2. Obtén credenciales
3. Configura en el panel de admin
4. Crea archivo de integración en `/app/api/admin/logistics/integrations/glovo.ts`

---

## Fase 5: Webhooks para Actualizaciones de Estado

### 5.1 Crear Endpoint de Webhook

Crea `/app/api/admin/logistics/webhooks/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { carrier, tracking_number, event_type, location, timestamp } = body

    // Encontrar el envío por número de seguimiento
    const { data: shipment } = await supabase
      .from("shipments")
      .select("id")
      .eq("tracking_number", tracking_number)
      .single()

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      )
    }

    // Actualizar estado del envío
    await supabase
      .from("shipments")
      .update({ status: event_type })
      .eq("id", shipment.id)

    // Crear evento
    await supabase.from("shipment_events").insert({
      shipment_id: shipment.id,
      event_type,
      location,
      timestamp: new Date(timestamp),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### 5.2 Configurar URLs de Webhook en Transportistas

Para cada transportista, configura la URL del webhook:

```
https://tu-dominio.com/api/admin/logistics/webhooks
```

---

## Fase 6: Notificaciones a Clientes

### 6.1 Crear Función de Notificación

Crea `/app/api/admin/logistics/notifications/send.ts`:

```typescript
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendShipmentNotification(
  shipmentId: string,
  notificationType: string
) {
  // Obtener datos del envío
  const { data: shipment } = await supabase
    .from("shipments")
    .select(
      `
      *,
      reservations (
        profiles (
          full_name,
          email
        ),
        bags (
          name,
          brand
        )
      )
    `
    )
    .eq("id", shipmentId)
    .single()

  if (!shipment) return

  const customerEmail = shipment.reservations.profiles.email
  const customerName = shipment.reservations.profiles.full_name

  // Preparar mensaje según tipo de notificación
  let subject = ""
  let htmlContent = ""

  switch (notificationType) {
    case "picked_up":
      subject = "Tu bolso está en camino"
      htmlContent = `
        <h2>¡Tu bolso está en camino!</h2>
        <p>Hola ${customerName},</p>
        <p>Tu envío ha sido recogido por ${shipment.carrier}.</p>
        <p>Número de seguimiento: ${shipment.tracking_number}</p>
      `
      break
    case "delivered":
      subject = "Tu bolso ha llegado"
      htmlContent = `
        <h2>¡Tu bolso ha llegado!</h2>
        <p>Hola ${customerName},</p>
        <p>Tu envío ha sido entregado correctamente.</p>
      `
      break
    // ... más tipos de notificación
  }

  // Enviar email
  await resend.emails.send({
    from: "noreply@semzoprive.com",
    to: customerEmail,
    subject,
    html: htmlContent,
  })

  // Registrar notificación en BD
  await supabase.from("shipment_notifications").insert({
    shipment_id: shipmentId,
    user_id: shipment.reservations.profiles.id,
    notification_type: notificationType,
    channel: "email",
    recipient: customerEmail,
    status: "sent",
    sent_at: new Date().toISOString(),
  })
}
```

---

## Fase 7: Testing y Validación

### 7.1 Checklist de Validación

- [ ] Base de datos creada correctamente
- [ ] Variables de entorno configuradas
- [ ] Panel de logística accesible
- [ ] Crear envío manual funciona
- [ ] API endpoints responden correctamente
- [ ] Transportistas configurados
- [ ] Webhooks reciben eventos
- [ ] Notificaciones se envían
- [ ] Auditoría registra cambios
- [ ] Devoluciones funcionan

### 7.2 Pruebas de Integración

```bash
# Instalar dependencias si es necesario
npm install axios

# Ejecutar pruebas
npm test -- logistics
```

---

## Fase 8: Deployment

### 8.1 Preparar para Producción

1. Asegúrate de que todas las variables de entorno estén configuradas en Vercel
2. Ejecuta las migraciones de BD en producción
3. Prueba los webhooks en producción
4. Verifica que los emails se envíen correctamente

### 8.2 Desplegar a Vercel

```bash
git add .
git commit -m "feat: add logistics module with carrier integrations"
git push origin main
```

---

## Solución de Problemas

### Problema: "Tabla no encontrada"

**Solución:** Asegúrate de haber ejecutado el script SQL completo en Supabase.

### Problema: "API Key inválida"

**Solución:** Verifica que las variables de entorno estén correctamente configuradas y sean válidas.

### Problema: Webhooks no se reciben

**Solución:** Verifica que la URL del webhook sea accesible desde internet y que el firewall no bloquee las conexiones.

### Problema: Notificaciones no se envían

**Solución:** Verifica que la API key de Resend esté correctamente configurada.

---

## Próximos Pasos

1. **Implementar Tracking en Tiempo Real:** Crear página de seguimiento para clientes
2. **Automatizar Creación de Envíos:** Crear automáticamente cuando se confirma una reserva
3. **Reportes Avanzados:** Dashboard de análisis de logística
4. **Integraciones Adicionales:** Más transportistas según demanda
5. **Mobile App:** Notificaciones push en app móvil

---

## Recursos Útiles

- [Documentación de Supabase](https://supabase.com/docs)
- [API de DHL](https://developer.dhl.com)
- [API de FedEx](https://developer.fedex.com)
- [API de UPS](https://www.ups.com/upsdeveloperkit)
- [Documentación de Resend](https://resend.com/docs)

---

## Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.
