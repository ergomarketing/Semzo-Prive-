# 🔧 GUÍA COMPLETA: Configuración de Stripe

## 🚨 PROBLEMA IDENTIFICADO
- ✅ Clave pública funcionando (usada hoy)
- ❌ Clave secreta NO funcionando (última vez: 15 mayo)
- ❌ No encuentras las claves API en el Dashboard

## 📋 PASO A PASO PARA SOLUCIONARLO

### 1. 🔍 ENCONTRAR LAS CLAVES API EN STRIPE DASHBOARD

1. **Ir a Stripe Dashboard**: https://dashboard.stripe.com
2. **Hacer clic en "Developers"** (en el menú lateral izquierdo)
3. **Hacer clic en "API keys"**
4. **Verificar que estés en modo LIVE** (toggle arriba a la derecha debe decir "Live")

### 2. 🔑 VERIFICAR/REGENERAR CLAVES API

**Si NO VES las claves API:**
1. Hacer clic en "Create secret key"
2. Darle un nombre: "Semzo Privé Production"
3. Seleccionar permisos: "Full access"
4. Copiar la nueva clave secreta (empieza con `sk_live_`)

**Si VES las claves pero no funcionan:**
1. Hacer clic en "Reveal" en la clave secreta
2. Copiar la clave completa
3. Si sigue sin funcionar, crear una nueva clave

### 3. 🎯 CONFIGURAR VARIABLES DE ENTORNO EN VERCEL

Ir a: https://vercel.com/tu-proyecto/settings/environment-variables

**Configurar estas 3 variables:**

\`\`\`
STRIPE_SECRET_KEY=sk_live_...TU_CLAVE_COMPLETA
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...TU_CLAVE_PUBLICA
STRIPE_WEBHOOK_SECRET=whsec_...TU_WEBHOOK_SECRET
\`\`\`

### 4. 🔄 REDEPLOY OBLIGATORIO

Después de cambiar las variables de entorno:
1. Ir a Vercel Dashboard
2. Hacer clic en "Deployments"
3. Hacer clic en "Redeploy" en el último deployment

### 5. ✅ VERIFICAR CONFIGURACIÓN

Usar la página de diagnósticos: `/admin/stripe-diagnostics`

## CLAVES ACTUALES

Las claves reales han sido eliminadas de este archivo por seguridad.
Consúltalas directamente en el panel de Stripe (Developers > API keys) y
en las variables de entorno de Vercel — nunca las escribas en un archivo
que se suba al repositorio.

## 🚨 IMPORTANTE: SEGURIDAD

- ⚠️ NUNCA compartas la clave secreta completa
- ⚠️ Las claves LIVE procesan pagos reales
- ⚠️ Guarda las claves en un lugar seguro

## 📞 SI SIGUES TENIENDO PROBLEMAS

1. Verificar que estés en el proyecto correcto de Stripe
2. Verificar permisos de tu cuenta en Stripe
3. Contactar soporte de Stripe si no puedes acceder a las claves
\`\`\`

Ahora vamos a crear una página de configuración rápida para verificar las claves:
