-- Fase 3 — Plantillas de las 7 secuencias de negocio (batch).
-- El copy de "membership_onboarding" (4 emails) se inserta en un script
-- aparte (insert-onboarding-email-templates.sql) porque usa el copy literal
-- proporcionado por el cliente.
--
-- IMPORTANTE: body_html aquí es solo el CONTENIDO (el header/footer de marca
-- ya lo pone EmailLayout / LifecycleSequenceEmail). No incluir <html>, header
-- ni footer aquí — a diferencia de las plantillas de leads (Secuencia 1, que
-- NO se toca), que sí llevan su propio header duplicado por diseño histórico.

delete from lifecycle_email_templates where sequence_key in (
  'checkout_abandoned', 'renewal_reminder', 'card_expiring', 'winback', 'pause_reactivation', 'back_in_stock', 'nps'
);

insert into lifecycle_email_templates (sequence_key, step_number, name, subject, delay_hours, body_html) values

-- ===== CHECKOUT ABANDONADO =====
('checkout_abandoned', 1, 'Checkout abandonado — Recordatorio suave', '¿Terminamos tu membresía, {{name}}?', 0, '
<p style="margin:0 0 20px;">Empezaste tu membresía SEMZO Privé y te quedaste a un paso. Tu selección sigue reservada, pero solo por unas horas más.</p>
<p style="margin:0 0 28px;">Termina el proceso ahora y accede hoy mismo a la colección completa.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/membresias" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Completar mi membresía</a>
</td></tr></table>'),

('checkout_abandoned', 2, 'Checkout abandonado — Última llamada', 'Tu reserva expira pronto, {{name}}', 23, '
<p style="margin:0 0 20px;">Última oportunidad: tu solicitud de membresía expira en breve y tendrás que empezar de nuevo.</p>
<p style="margin:0 0 28px;">Si tuviste dudas durante el proceso, responde a este email — te ayudamos personalmente.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/membresias" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Terminar antes de que expire</a>
</td></tr></table>'),

-- ===== AVISO DE RENOVACIÓN =====
('renewal_reminder', 1, 'Renovación — 7 días antes', 'Tu membresía se renueva en una semana', 0, '
<p style="margin:0 0 20px;">Hola {{name}}, tu membresía SEMZO Privé se renueva automáticamente en 7 días.</p>
<p style="margin:0 0 28px;">Si todo está en orden, no necesitas hacer nada. Si quieres revisar tu plan o método de pago, puedes hacerlo desde tu panel.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/dashboard" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Ver mi membresía</a>
</td></tr></table>'),

('renewal_reminder', 2, 'Renovación — 3 días antes', 'Tu renovación es en 3 días', 0, '
<p style="margin:0 0 20px;">{{name}}, en 3 días se procesará la renovación de tu membresía.</p>
<p style="margin:0 0 28px;">Cualquier cambio de plan o método de pago debe hacerse antes de esa fecha.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/dashboard" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Revisar antes de renovar</a>
</td></tr></table>'),

-- ===== TARJETA POR CADUCAR =====
('card_expiring', 1, 'Tarjeta por caducar', 'Tu tarjeta caduca pronto — actualízala para no perder acceso', 0, '
<p style="margin:0 0 20px;">Hola {{name}}, hemos detectado que tu tarjeta {{card_brand}} terminada en {{card_last4}} caduca antes de tu próxima renovación.</p>
<p style="margin:0 0 28px;">Actualiza tu método de pago para que tu membresía no se vea interrumpida.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/dashboard" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Actualizar método de pago</a>
</td></tr></table>'),

-- ===== WIN-BACK =====
('winback', 1, 'Win-back — 15 días', 'Te echamos de menos, {{name}}', 0, '
<p style="margin:0 0 20px;">Han pasado 15 días desde que dejaste SEMZO Privé. La colección sigue creciendo — y tú sigues teniendo tu lugar aquí.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/membresias" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Volver a la colección</a>
</td></tr></table>'),

('winback', 2, 'Win-back — 30 días', 'Ha llegado algo que te va a interesar', 0, '
<p style="margin:0 0 20px;">{{name}}, hemos incorporado nuevas piezas desde que te fuiste. Merece la pena echar un vistazo.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/catalog" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Ver la colección actual</a>
</td></tr></table>'),

('winback', 3, 'Win-back — 60 días', 'Una última invitación, {{name}}', 0, '
<p style="margin:0 0 20px;">No queremos insistir más de la cuenta, pero sí queríamos dejarte esta puerta abierta una última vez.</p>
<p style="margin:0 0 28px;">Cuando quieras volver, aquí estaremos.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/membresias" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Reactivar mi membresía</a>
</td></tr></table>'),

-- ===== REACTIVACIÓN DE PAUSA =====
('pause_reactivation', 1, 'Reactivación de pausa — 15 días', '¿Lista para volver, {{name}}?', 0, '
<p style="margin:0 0 20px;">Tu membresía sigue pausada. Reactivarla te devuelve acceso inmediato a toda la colección.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/dashboard" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Reactivar ahora</a>
</td></tr></table>'),

('pause_reactivation', 2, 'Reactivación de pausa — 30 días', 'Tu pausa lleva un mes, {{name}}', 0, '
<p style="margin:0 0 20px;">Han pasado 30 días desde que pausaste tu membresía. Si quieres seguir disfrutando de SEMZO Privé, reactivarla toma un minuto.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/dashboard" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Reactivar mi membresía</a>
</td></tr></table>'),

-- ===== BACK IN STOCK =====
('back_in_stock', 1, 'Back in stock', '{{bag_name}} ya está disponible', 0, '
<p style="margin:0 0 20px;">Buenas noticias, {{name}}: el bolso que tenías en tu lista de deseos, {{bag_name}}, ya está disponible.</p>
<p style="margin:0 0 28px;">La disponibilidad es limitada — te recomendamos reservarlo cuanto antes.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/catalog" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Reservar ahora</a>
</td></tr></table>'),

-- ===== NPS =====
('nps', 1, 'NPS post-reserva', '{{name}}, ¿cómo fue tu experiencia?', 0, '
<p style="margin:0 0 20px;">Nos encantaría saber qué te pareció tu última experiencia con SEMZO Privé.</p>
<p style="margin:0 0 28px;">¿Qué probabilidad hay de que nos recomiendes a una amiga? Solo te llevará un momento.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a4b;padding:14px 32px;">
<a href="{{app_url}}/feedback" style="color:#c6a15b;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Dejar mi opinión</a>
</td></tr></table>');
