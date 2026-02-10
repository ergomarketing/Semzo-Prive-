# Guía de Eliminación Segura de Usuarios

## Problema Identificado

Cuando intentas eliminar un usuario directamente de Supabase, obtienes el error:
\`\`\`
Failed to delete user: Database error deleting user
\`\`\`

**Causa**: Restricciones de foreign keys. El usuario tiene registros relacionados en múltiples tablas que deben eliminarse primero.

## Solución Implementada

Se ha creado un sistema de eliminación segura que maneja automáticamente todas las dependencias.

### Endpoints Disponibles

#### 1. Eliminación General (Recomendado)
\`\`\`bash
POST /api/admin/delete-user
Content-Type: application/json

{
  "userId": "uuid-del-usuario",
  // O alternativamente:
  "email": "usuario@example.com",
  // O:
  "phone": "+34624239394"
}
\`\`\`

#### 2. Eliminación por Teléfono (Simplificado)
\`\`\`bash
DELETE /api/admin/delete-user/by-phone?phone=+34624239394
\`\`\`

### Orden de Eliminación

El sistema elimina registros en este orden (de más dependiente a menos):

1. **Notificaciones y Alertas**
   - shipment_notifications
   - sms_verification_codes
   - notifications
   - admin_notifications
   - admin_alerts

2. **Datos de Usuario**
   - waitlist
   - wishlists/wishlist
   - bag_passes
   - newsletter_subscriptions
   - addresses

3. **Historial y Auditoría**
   - membership_history
   - audit_log
   - identity_verifications

4. **Transacciones y Pagos**
   - gift_cards
   - gift_card_transactions
   - payment_history

5. **Reservas y Membresías**
   - reservations
   - subscriptions
   - user_memberships
   - pending_memberships

6. **Perfil y Autenticación** (último)
   - profiles
   - auth.users

### Características de Seguridad

- **Transaccional**: Si falla en algún punto, reporta el estado parcial
- **Tolerante a errores**: Continúa si una tabla no existe
- **Logging completo**: Registra cada paso para debugging
- **Flexible**: Acepta userId, email o phone para identificar al usuario

## Cómo Resolver el Usuario Atascado

### Caso Actual: +34624239394

Tienes un usuario con teléfono +34624239394 que ha estado pendiente de verificación por 2 días y no se puede eliminar.

**Solución Inmediata**:

#### Opción A: Usar el nuevo endpoint (Recomendado)
\`\`\`bash
# Desde Postman o similar
POST https://tu-dominio.vercel.app/api/admin/delete-user
Content-Type: application/json

{
  "phone": "+34624239394"
}
\`\`\`

#### Opción B: Usar el endpoint simplificado
\`\`\`bash
DELETE https://tu-dominio.vercel.app/api/admin/delete-user/by-phone?phone=+34624239394
\`\`\`

#### Opción C: Desde código cliente
\`\`\`typescript
const response = await fetch('/api/admin/delete-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+34624239394' })
})

const result = await response.json()
console.log(result)
\`\`\`

## Respuesta Esperada

\`\`\`json
{
  "success": true,
  "message": "Usuario eliminado exitosamente",
  "userInfo": {
    "id": "3742b414-d889-4164-8e78-97bd58929947",
    "phone": "+34624239394",
    "email": "+34624239394@phone.semzoprive.com"
  },
  "deletionResults": [
    { "table": "shipment_notifications", "status": "success", "deleted": 0 },
    { "table": "sms_verification_codes", "status": "success", "deleted": 1 },
    { "table": "profiles", "status": "success", "deleted": 1 },
    ...
  ]
}
\`\`\`

## Prevención de Problemas Futuros

### 1. Código de Verificación Expirado

**Problema**: Los códigos OTP de Supabase expiran en 60 segundos, pero tu tabla guarda por 10 minutos.

**Mejora Implementada**: Mensajes más claros en `sms-auth-modal.tsx` informando al usuario del tiempo de expiración.

### 2. Limpieza Automática

Considera agregar un cron job para limpiar usuarios no verificados después de cierto tiempo:

\`\`\`typescript
// app/api/cron/cleanup-unverified/route.ts
export async function GET() {
  // Eliminar usuarios con más de 7 días sin verificar
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  
  for (const user of users.users) {
    if (!user.email_confirmed_at && !user.phone_confirmed_at) {
      const createdAt = new Date(user.created_at)
      if (createdAt < sevenDaysAgo) {
        await fetch('/api/admin/delete-user', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id })
        })
      }
    }
  }
}
\`\`\`

## Notas de Seguridad

1. **Protege estos endpoints**: Agrega autenticación admin antes de producción
2. **Rate limiting**: Implementa límite de solicitudes para prevenir abuso
3. **Auditoría**: Considera registrar todas las eliminaciones en `audit_log`
4. **Backup**: Siempre haz backup antes de eliminaciones masivas

## Testing

Puedes probar la eliminación con usuarios de prueba:

\`\`\`typescript
// 1. Crear usuario de prueba
const { data } = await supabase.auth.signUp({
  phone: '+34600000000',
  password: 'test123'
})

// 2. Eliminarlo inmediatamente
await fetch('/api/admin/delete-user', {
  method: 'POST',
  body: JSON.stringify({ userId: data.user?.id })
})
\`\`\`

## Soporte

Si encuentras problemas:
1. Revisa los logs del servidor con `[DELETE-USER]`
2. Verifica que `SUPABASE_SERVICE_KEY` esté configurada
3. Confirma que RLS está habilitado en todas las tablas
4. Revisa el campo `deletionResults` en la respuesta para ver qué falló
