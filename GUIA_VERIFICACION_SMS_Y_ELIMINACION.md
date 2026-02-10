# Guía de Verificación SMS y Eliminación de Usuarios

## Sistema de Verificación SMS

### Cómo Funciona

El sistema usa **Supabase Auth OTP nativo**, características importantes:

- Los códigos OTP expiran en **60 segundos** (no 10 minutos)
- No se almacenan en tabla personalizada (se gestionan internamente en Supabase)
- Los códigos son de un solo uso
- Se envían vía proveedor SMS configurado en Supabase

### Solución para Tu Caso: Usuario Atascado 2 Días

Para el usuario con el número que estuvo pendiente 2 días:

**Opción 1: Eliminar y Reiniciar (Recomendado)**

\`\`\`bash
DELETE /api/admin/delete-user/by-phone?phone=+34624239394
\`\`\`

Después el usuario puede registrarse nuevamente desde cero.

**Opción 2: Reenviar Código**

\`\`\`bash
POST /api/sms/resend-code
Content-Type: application/json

{
  "phone": "+34624239394"
}
\`\`\`

Esto enviará un nuevo código válido por 60 segundos.

---

## Sistema de Eliminación de Usuarios

### Endpoints Disponibles

#### 1. Eliminar por Teléfono

\`\`\`bash
DELETE /api/admin/delete-user/by-phone?phone=+34624239394
\`\`\`

**Uso desde navegador/Postman:**
\`\`\`
DELETE https://tu-dominio.com/api/admin/delete-user/by-phone?phone=+34624239394
\`\`\`

**Respuesta exitosa:**
\`\`\`json
{
  "success": true,
  "message": "Usuario eliminado exitosamente",
  "userInfo": {
    "id": "uuid-del-usuario",
    "phone": "+34624239394",
    "email": null
  },
  "deletionResults": [
    { "table": "notifications", "status": "success", "deleted": 0 },
    { "table": "payment_history", "status": "success", "deleted": 0 }
  ]
}
\`\`\`

#### 2. Eliminar por ID de Usuario

\`\`\`bash
POST /api/admin/delete-user
Content-Type: application/json

{
  "userId": "uuid-aqui"
}
\`\`\`

#### 3. Eliminar por Email

\`\`\`bash
POST /api/admin/delete-user
Content-Type: application/json

{
  "email": "usuario@example.com"
}
\`\`\`

---

## Orden de Eliminación Automática

El sistema elimina en este orden para evitar errores de foreign keys:

1. `shipment_notifications`
2. `notifications`
3. `admin_notifications` y `admin_alerts`
4. `waitlist` y `wishlists`
5. `bag_passes`
6. `newsletter_subscriptions`
7. `addresses`
8. `membership_history`
9. `audit_log`
10. `identity_verifications`
11. `gift_cards` y `gift_card_transactions`
12. `payment_history`
13. `reservations`
14. `subscriptions`
15. `user_memberships` y `pending_memberships`
16. `profiles`
17. `auth.users` (Supabase Auth)

---

## Casos de Uso Comunes

### Caso 1: Usuario con Verificación Pendiente desde Hace Días (Tu Caso)

\`\`\`bash
# El código expiró hace mucho tiempo, elimina el usuario
DELETE /api/admin/delete-user/by-phone?phone=+34624239394

# El usuario puede registrarse de nuevo
\`\`\`

### Caso 2: Código Expiró Durante el Proceso

\`\`\`bash
# Reenviar nuevo código (usuario tiene 60 segundos)
POST /api/sms/resend-code
Content-Type: application/json

{
  "phone": "+34624239394"
}
\`\`\`

### Caso 3: Usuario Quiere Cambiar de Número

\`\`\`bash
# Eliminar cuenta con número viejo
DELETE /api/admin/delete-user/by-phone?phone=+34NUMEROVIEJO

# Usuario puede registrarse con número nuevo
\`\`\`

---

## Errores Comunes y Soluciones

### Error: "Código inválido o expirado"

**Causa**: El código OTP expiró (>60 segundos) o ya fue usado

**Solución Inmediata**:
\`\`\`bash
POST /api/sms/resend-code
Body: { "phone": "+34624239394" }
\`\`\`

### Error: "Database error deleting user" (Tu Error)

**Causa**: Intentaste eliminar directamente desde Supabase Dashboard sin respetar foreign keys

**Solución**: Usa el endpoint que maneja todo automáticamente:
\`\`\`bash
DELETE /api/admin/delete-user/by-phone?phone=+34624239394
\`\`\`

### Error: "Usuario no encontrado"

**Causa**: El usuario ya fue eliminado o el formato del teléfono es incorrecto

**Solución**: Verifica el formato (debe incluir código de país: +34)

---

## Mejoras Recomendadas para el Frontend

### 1. Timer Visible de Expiración

\`\`\`tsx
const [timeLeft, setTimeLeft] = useState(60)

useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft(prev => prev > 0 ? prev - 1 : 0)
  }, 1000)
  return () => clearInterval(timer)
}, [codeRequestTime])

// UI: "Código válido por {timeLeft} segundos"
\`\`\`

### 2. Botón de Reenvío

\`\`\`tsx
{timeLeft === 0 && (
  <button onClick={handleResendCode}>
    Reenviar código
  </button>
)}
\`\`\`

### 3. Auto-expiración del Formulario

\`\`\`tsx
useEffect(() => {
  if (timeLeft === 0) {
    setCode('')
    setError('El código ha expirado. Solicita uno nuevo.')
  }
}, [timeLeft])
\`\`\`

---

## Testing

### Probar Eliminación por Teléfono

1. Crear usuario de prueba desde el frontend
2. Verificar que existe en Supabase Dashboard
3. Llamar al endpoint:
\`\`\`bash
curl -X DELETE "http://localhost:3000/api/admin/delete-user/by-phone?phone=+34TEST123"
\`\`\`
4. Verificar que fue eliminado completamente

### Probar Reenvío de Código

1. Iniciar verificación SMS desde frontend
2. Esperar >60 segundos
3. Hacer request de reenvío:
\`\`\`bash
curl -X POST http://localhost:3000/api/sms/resend-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+34TEST123"}'
\`\`\`
4. Ingresar el nuevo código en <60 segundos

---

## Notas de Seguridad

- [ ] Agregar autenticación admin a `/api/admin/delete-user/*`
- [ ] Implementar rate limiting para prevenir abuse
- [ ] Registrar eliminaciones en audit_log antes de eliminar
- [ ] No exponer endpoints de admin públicamente
- [ ] Considerar soft delete en lugar de hard delete para producción

---

## Resumen para Tu Situación

**Tu problema específico:**
- Usuario con teléfono +34624239394 pendiente de verificación hace 2 días
- Error al intentar eliminar desde Supabase Dashboard

**Solución inmediata:**
\`\`\`bash
DELETE /api/admin/delete-user/by-phone?phone=+34624239394
\`\`\`

Después el usuario puede:
1. Volver a la página de registro
2. Ingresar el mismo número
3. Recibir un código nuevo
4. Ingresarlo en menos de 60 segundos
5. Completar el registro exitosamente

**Prevención futura:**
- Agregar timer visible de 60 segundos en el frontend
- Agregar botón "Reenviar código" que llame a `/api/sms/resend-code`
- Mostrar mensaje claro: "Este código expira en 60 segundos"
