# Configuración del SMS Hook Personalizado

## Pasos para activar "Semzo Privé" como remitente:

### 1. Ejecutar Scripts SQL
En tu Supabase Dashboard → SQL Editor, ejecuta en este orden:

1. **Primero:** `scripts/create-sms-hook.sql`
2. **Segundo:** `scripts/configure-sms-hook.sql`

### 2. Configurar Variable de Entorno
Agrega en tu proyecto Vercel (opcional para cuentas gratuitas):
```
TWILIO_MESSAGING_SERVICE_SID=tu_messaging_service_sid
```

### 3. Verificar Configuración
En Supabase SQL Editor, ejecuta:
```sql
SELECT sms_provider, sms_custom_hook_uri 
FROM auth.config 
WHERE id = 'default';
```

Debería mostrar:
- `sms_provider`: "custom"
- `sms_custom_hook_uri`: "send_custom_sms"

### 4. Probar el Sistema
Una vez configurado, todos los SMS de autenticación mostrarán:
```
"Tu código de verificación Semzo Privé es: 123456. Válido por 5 minutos."
```

### Notas Importantes:
- Con cuenta gratuita de Twilio, el número remitente seguirá siendo de Twilio
- Pero el MENSAJE incluirá "Semzo Privé" claramente
- Para cambiar completamente el remitente necesitas cuenta paga + Alphanumeric Sender ID
