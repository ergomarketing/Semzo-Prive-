# 🚀 GUÍA DE CONFIGURACIÓN SEMZO PRIVÉ

## 📋 CONFIGURACIÓN RÁPIDA (5 MINUTOS)

### 1️⃣ VARIABLES DE ENTORNO
Crear archivo `.env.local` en la raíz del proyecto:

\`\`\`env
# 📧 EMAIL CONFIGURATION
EMAIL_API_KEY=tu_api_key_aqui
EMAIL_PROVIDER=resend

# 🔗 SUPABASE
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# 🔒 ADMIN ACCESS
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro_aqui

# 🌐 ENVIRONMENT
NODE_ENV=production
\`\`\`

### 2️⃣ CONFIGURAR EMAIL (OPCIÓN A: RESEND - RECOMENDADO)
1. Ir a [resend.com](https://resend.com)
2. Crear cuenta gratuita
3. Verificar dominio (semzoprive.com)
4. Copiar API Key
5. Pegar en `.env.local`

### 3️⃣ CONFIGURAR EMAIL (OPCIÓN B: SENDGRID)
1. Ir a [sendgrid.com](https://sendgrid.com)
2. Crear cuenta
3. Verificar dominio
4. Generar API Key
5. Cambiar `EMAIL_PROVIDER=sendgrid` en `.env.local`

### 4️⃣ CONFIGURAR ADMIN
1. Cambiar `ADMIN_USERNAME` y `ADMIN_PASSWORD` en `.env.local`
2. Usar contraseña segura (mínimo 12 caracteres)
3. Acceso: `tudominio.com/admin/login`

### 5️⃣ VERIFICAR CONFIGURACIÓN
1. Subir a hosting con HTTPS
2. Probar login admin
3. Enviar email de prueba
4. ✅ ¡Listo!

## 🔧 ARCHIVOS IMPORTANTES
- `app/config/email-config.tsx` - Configuración principal
- `app/lib/email-service-production.tsx` - Servicio de emails
- `app/admin/login/page.tsx` - Login de admin
- `.env.local` - Variables de entorno

## 📞 SOPORTE
Si algo no funciona:
1. Verificar que todas las variables estén en `.env.local`
2. Comprobar que el dominio esté verificado en el proveedor de email
3. Revisar logs del servidor para errores específicos

## 🎯 FUNCIONALIDADES INCLUIDAS
✅ Sistema de emails automáticos
✅ Panel de administración protegido
✅ Gestión de inventario
✅ Lista de espera automática
✅ Calendario de reservas
✅ Templates profesionales de email
✅ PWA (Progressive Web App)

¡TODO LISTO PARA PRODUCCIÓN! 🚀
