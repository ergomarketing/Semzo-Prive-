# Configuración del Cupón PRIVE50 en Stripe

## Pasos para crear el cupón de invitación

### 1. Acceder al Dashboard de Stripe

1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com)
2. Navega a **Products** → **Coupons**
3. Haz clic en **"Create coupon"**

### 2. Configuración del Cupón

**Detalles básicos:**
- **Coupon ID**: `PRIVE50` (este es el código que las usuarias ingresarán)
- **Name**: Invitación Exclusiva Semzo Privé
- **Type**: Percentage discount
- **Percentage off**: `50%`

**Aplicación:**
- **Duration**: Once (se aplica solo en el primer pago)
- **Applies to**: All products (o específicamente a tus productos de membresía)

**Límites (opcional):**
- **Max redemptions**: Dejar vacío para ilimitado, o poner un número (ej: 100)
- **First time transaction**: Activar esta opción para que solo funcione con nuevas clientas
- **Expiration date**: Opcional - puedes poner una fecha de expiración

### 3. Configuración Recomendada para Semzo Privé

\`\`\`
ID: PRIVE50
Descuento: 50%
Duración: Una vez (solo primer mes)
Límite de usos: Sin límite (o 100 si quieres controlar)
Solo nuevas clientas: Sí
Fecha de expiración: No (o 6 meses desde hoy)
\`\`\`

### 4. Verificar Integración

Tu código ya está preparado para validar cupones en:
- `/app/api/payments/validate-coupon/route.ts`
- `/app/components/payment-form-content.tsx`

Cuando una usuaria ingrese `PRIVE50` en el checkout, el sistema:
1. Valida el cupón con Stripe
2. Aplica el descuento automáticamente
3. Muestra el nuevo precio con descuento
4. Procesa el pago con el descuento aplicado

### 5. Tracking

Para ver cuántas personas han usado el cupón:
1. Ve a Stripe Dashboard → Coupons
2. Haz clic en `PRIVE50`
3. Verás estadísticas de uso, ingresos afectados, etc.

---

## Notas Importantes

- El cupón `PRIVE50` solo se aplica al **primer pago**
- Los meses siguientes se cobrarán a precio completo
- Stripe maneja automáticamente la validación y límites
- No necesitas código adicional, todo está integrado
