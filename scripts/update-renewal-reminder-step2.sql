-- Actualiza lifecycle_email_templates (renewal_reminder, step_number=2):
-- documento de marca completo, con {{name}}, {{tier}}, {{precio}} y
-- {{fecha_renovacion}} resueltos desde checkRenewalReminders en
-- app/api/cron/check-lifecycle-triggers/route.ts (trigger: fecha_renovacion
-- - 3 días, es decir current_period_end - 3 días).
--
-- Ejecutado ya directamente vía Supabase MCP; este script queda como
-- registro versionado y para poder re-aplicarlo si es necesario.

update lifecycle_email_templates
set
  is_full_document = true,
  subject = 'Tu renovación es en 3 días',
  updated_at = now()
where sequence_key = 'renewal_reminder' and step_number = 2;
-- body_html: ver app/api/cron/check-lifecycle-triggers/route.ts (checkRenewalReminders)
-- para las variables que se resuelven, y el historial de esta chat para el
-- HTML completo aplicado.
