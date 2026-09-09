-- Fase 3 — Secuencia 2: Onboarding post-activación (4 emails).
-- Trigger real: user_memberships.status pasa a 'active' por primera vez
-- (app/api/membership/activate/orchestrator.ts), NUNCA el registro al
-- newsletter. Completamente aislado de la Secuencia 1 (leads).
--
-- NOTA: el copy de abajo es PROVISIONAL (tono editorial de marca) porque el
-- copy literal del cliente aún no se ha recibido. Cuando llegue, sustituir
-- con un UPDATE puntual sobre subject/body_html por step_number — no hace
-- falta re-ejecutar todo el script ni tocar el resto de la infraestructura.

delete from lifecycle_email_templates where sequence_key = 'membership_onboarding';

insert into lifecycle_email_templates (sequence_key, step_number, name, subject, delay_hours, body_html) values

('membership_onboarding', 1, 'Onboarding — Bienvenida (inmediato)', 'Bienvenida al club, {{name}}', 0, '
<p style="margin:0 0 20px;">{{name}}, tu membresía SEMZO Privé ya está activa. Bienvenida al club.</p>
<p style="margin:0 0 28px;">Ya puedes elegir tu primer bolso y empezar a disfrutar de tu membresía hoy mismo.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/catalog" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Elegir mi primer bolso</a>
</td></tr></table>'),

('membership_onboarding', 2, 'Onboarding — Ayuda a elegir (+24h)', '¿Para qué ocasión buscas tu primer bolso, {{name}}?', 24, '
<p style="margin:0 0 20px;">Elegir el primer bolso puede parecer difícil con tantas opciones. Te ayudamos a decidir según la ocasión: trabajo, evento, día a día o viaje.</p>
<p style="margin:0 0 28px;">Cuéntanos qué buscas y te sugerimos las piezas que mejor encajan.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/catalog" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Ver la colección por ocasión</a>
</td></tr></table>'),

('membership_onboarding', 3, 'Onboarding — Cómo funciona la entrega (+3 días)', 'Así llega tu bolso a casa, {{name}}', 72, '
<p style="margin:0 0 20px;">Queremos que sepas exactamente qué esperar: cómo se prepara tu envío, los plazos de entrega y cómo se hace la devolución. Sin sorpresas.</p>
<p style="margin:0 0 28px;">Toda la información sobre el proceso de entrega está disponible en tu panel.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/dashboard" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Ver cómo funciona la entrega</a>
</td></tr></table>'),

('membership_onboarding', 4, 'Onboarding — Modo Colecciona (+7 días)', 'Descubre el modo Colecciona, {{name}}', 168, '
<p style="margin:0 0 20px;">¿Sabías que puedes quedarte con un bolso para siempre? Con el modo Colecciona, si te enamoras de una pieza, puedes hacerla tuya.</p>
<p style="margin:0 0 28px;">Te explicamos cómo funciona y cómo aplicar el importe ya pagado en alquiler a la compra.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/dashboard" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Descubrir modo Colecciona</a>
</td></tr></table>');
