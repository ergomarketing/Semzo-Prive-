# Reglas de Negocio y Arquitectura - Semzo Privé

**Versión:** 1.0  
**Fecha:** 23 Enero 2026  
**Autor:** Equipo Técnico Semzo Privé

---

## 🎯 Principio Fundamental

> **Membresía = Permiso | Pase = Consumo | Reserva = Ejecución**
> 
> Si rompes esta tríada, el sistema deja de ser válido.

---

## 🧠 CONTEXTO FUNCIONAL — SOURCE OF TRUTH (INMUTABLE)

### 1. MODELO DE NEGOCIO (NO INTERPRETABLE)

#### Membresía (Petite)
- Es una **suscripción de acceso**, NO un producto de consumo
- **Habilita:**
  - Acceso al catálogo
  - Derecho a reservar bolsos
- **NO asigna bolsos automáticamente**

#### Pases de Bolso (bag_passes)
- Son **créditos de consumo**
- Se consumen al reservar un bolso
- **SOLO pueden comprarse si la membresía está ACTIVA**

#### Reserva (reservations)
- **Requiere:**
  - Membresía activa
  - Pase disponible del tier correcto
- **Consume exactamente 1 pase**

---

## 🚨 REGLAS DE ORO (NO NEGOCIABLES)

### ❌ Prohibiciones Absolutas

1. **Nunca permitir comprar pases sin membresía activa**
2. **Nunca consumir pases sin membresía activa**
3. **Nunca mezclar membresía y pase como si fueran lo mismo**
4. **Nunca eliminar validaciones funcionales para "arreglar" un bug**
5. **Nunca modificar reglas de negocio sin confirmación explícita**

---

## 🧱 SEPARACIÓN DE RESPONSABILIDADES (OBLIGATORIA)

### 🔒 ZONA CONGELADA — NO TOCAR

**RPC:** `create_reservation_atomic`
- Locks transaccionales
- Atomicidad
- Infraestructura DB
- **NO contiene lógica de negocio**

**Cambios permitidos:** NINGUNO sin aprobación arquitectónica

---

### 🔧 ZONA EVOLUTIVA — SOLO CON PERMISO

**Endpoint:** `/app/api/user/reservations/route.ts`
- Validaciones de negocio
- Reglas de vigencia
- Límites de pases
- Tiers

**Cambios permitidos:** Reglas de negocio tras análisis de impacto

---

## 🛑 PROTOCOLO ANTES DE CUALQUIER CAMBIO

### Alcance del Protocolo

**ANTES** de escribir código que afecte a:
- Membresías
- Pases
- Reservas
- Pagos
- Estados de usuario

### 👉 Checklist Obligatorio

Debes responder:
1. **¿Qué regla funcional estás tocando?**
2. **¿Por qué existe esa regla?**
3. **¿Qué efecto tiene eliminarla?**
4. **¿Qué estados inválidos podría crear?**
5. **¿Tienes confirmación explícita?**

**Si no puedes justificarlo → NO CAMBIAS NADA.**

---

## ✅ FORMATO DE RESPUESTA OBLIGATORIO

Cuando propongas un cambio funcional, debes responder así:

```
CAMBIO PROPUESTO:
- Archivo: [ruta del archivo]
- Regla afectada: [descripción de la regla actual]
- Impacto en modelo de negocio: [análisis de consecuencias]
- Estados nuevos creados: [estados posibles tras el cambio]
- Riesgo: [BAJO/MEDIO/ALTO/CRÍTICO]

¿Confirmas este cambio? (SI / NO)
```

**Hasta recibir "SI", NO implementas nada.**

---

## 📊 ESTADOS VÁLIDOS DEL SISTEMA

### Flujo Correcto

```
1. Usuario se registra (por SMS o email)
   └─ Estado: sin membresía

2. Usuario compra membresía
   └─ Estado: paid_pending_verification
   └─ Acción: debe verificar identidad

3. Usuario verifica identidad
   └─ Estado: active
   └─ Puede: comprar pases

4. Usuario compra pases
   └─ Estado: pases disponibles
   └─ Puede: hacer reservas

5. Usuario reserva bolso
   └─ Consume: 1 pase
   └─ Crea: 1 reserva confirmed
```

### Estados Inválidos (NUNCA deben ocurrir)

```
❌ Pase comprado sin membresía activa
❌ Reserva creada sin pase disponible
❌ Reserva creada sin membresía activa
❌ Pase consumido sin crear reserva
❌ Membresía "activa" sin verificación de identidad completada
```

---

## 🔐 AUTORIDAD Y RESPONSABILIDAD

### Roles Definidos

| Rol | Puede Modificar | Requiere Aprobación |
|-----|-----------------|---------------------|
| **Backend Engineer** | Endpoints de API, validaciones | Sí, para cambios en reglas de negocio |
| **Frontend Engineer** | UI/UX, componentes | No, para lógica de negocio |
| **Product Owner** | Reglas de negocio | Documenta en este archivo |
| **Arquitecto** | RPC, estructura DB | Sí, con análisis de impacto completo |

### Principio de Menor Privilegio

- **Tú no decides cambios de negocio**
- **Tú ejecutas instrucciones, no las reinterpretas**
- **Si hay duda → preguntas, no actúas**

---

## 🧪 VALIDACIÓN DE CAMBIOS

### Checklist Pre-Deploy

Antes de hacer deploy de cambios que afecten el core:

- [ ] ¿Se respeta la separación Membresía/Pase/Reserva?
- [ ] ¿Las validaciones de negocio están en el endpoint correcto?
- [ ] ¿El RPC solo contiene locks transaccionales?
- [ ] ¿Se probaron todos los estados de transición?
- [ ] ¿Se documentó el cambio en este archivo?
- [ ] ¿Product Owner aprobó explícitamente?

---

## 📝 HISTORIAL DE CAMBIOS ARQUITECTÓNICOS

### v1.0 - 23 Enero 2026
- Documento inicial creado
- Separación estricta RPC vs Endpoint establecida
- Reglas de negocio documentadas
- Protocolo de cambios definido

---

## 🆘 CASOS DE EMERGENCIA

### Si el sistema está en producción con estado inválido:

1. **NO arregles eliminando validaciones**
2. **Documenta el estado inconsistente**
3. **Propón script de migración de datos**
4. **Ejecuta corrección de datos antes de código**
5. **Despliega validaciones después de limpieza**

### Contacto Escalamiento

Para cambios críticos que requieren aprobación inmediata:
- Product Owner: [pendiente]
- Arquitecto Lead: [pendiente]

---

## 📚 LECTURAS RELACIONADAS

- `/CONSOLIDACION_COMPLETA_ESTADO_SISTEMA.md` - Estado actual del sistema
- `/MIGRACION_RPC_V3_COMPLETADA.md` - Cambios en atomicidad
- `/scripts/create-atomic-reservation-rpc-v3-corrected.sql` - RPC actual

---

**Última actualización:** 23 Enero 2026  
**Mantenido por:** Equipo Técnico Semzo Privé
