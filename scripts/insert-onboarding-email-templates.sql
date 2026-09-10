-- Fase 3 — Secuencia 2: Onboarding post-activación (4 emails).
-- Trigger real: user_memberships.status pasa a 'active' por primera vez
-- (app/api/membership/activate/orchestrator.ts), NUNCA el registro al
-- newsletter. Completamente aislado de la Secuencia 1 (leads).
--
-- Copy literal del cliente (aplicado). {{tier}} = nombre legible de la
-- membresía (Petite / L'Essentiel / Signature / Privé), inyectado por el
-- orchestrator junto con {{name}}.

delete from lifecycle_email_templates where sequence_key = 'membership_onboarding';

insert into lifecycle_email_templates (sequence_key, step_number, name, subject, delay_hours, body_html) values

('membership_onboarding', 1, 'Onboarding — Bienvenida al club (inmediato)', 'Bienvenida al club', 0, '
<p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;font-family:Georgia,serif;">Membresía activa</p>
<h2 style="margin:0 0 28px;font-size:26px;color:#1a1a2e;font-family:Georgia,serif;font-weight:normal;line-height:1.3;">Ya eres parte de<br>SEMZO PRIVÉ.</h2>
<p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">No es una confirmación de pago. Es algo distinto — acabas de entrar a un espacio donde el lujo se experimenta sin el peso de poseerlo. Donde un bolso no es una compra impulsiva de la que luego te arrepientes. Es una decisión consciente, temporal, y completamente tuya.</p>
<p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">Tu membresía {{tier}} está activa desde hoy.</p>
<p style="margin:0 0 32px;font-size:16px;color:#1a1a2e;font-family:Georgia,serif;line-height:1.7;font-style:italic;">El siguiente paso es elegir tu primer bolso. Tómate el tiempo que necesites — no hay prisa. Pero cuando lo veas, lo sabrás.</p>
<table cellpadding="0" cellspacing="0">
  <tr>
    <td style="background:#1a1a2e;padding:16px 40px;">
      <a href="{{app_url}}/catalog" style="color:#c9a96e;font-family:Georgia,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;text-decoration:none;">Explorar la colección →</a>
    </td>
  </tr>
</table>
<p style="margin:40px 0 0;font-size:15px;color:#333350;line-height:1.7;font-family:Georgia,serif;">Si tienes cualquier pregunta, responde a este email. Llega directamente a mí.</p>
<p style="margin:16px 0 0;font-size:15px;color:#333350;line-height:1.7;font-family:Georgia,serif;font-style:italic;">Con cariño,<br>Erika</p>'),

('membership_onboarding', 2, 'Onboarding — Ayuda a elegir (+24h)', '¿Ya tienes tu bolso favorito?', 24, '
<p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;font-family:Georgia,serif;">Elegir tu primer bolso</p>
<h2 style="margin:0 0 28px;font-size:26px;color:#1a1a2e;font-family:Georgia,serif;font-weight:normal;line-height:1.3;">Ayer abriste la puerta.<br>Hoy quiero ayudarte a cruzarla.</h2>
<p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">Elegir el primer bolso puede parecer difícil cuando tienes acceso a Chanel, Dior, Louis Vuitton y Loewe al mismo tiempo. Es normal. Aquí va un criterio simple que funciona:</p>
<p style="margin:0 0 20px;font-size:16px;color:#1a1a2e;line-height:1.7;font-family:Georgia,serif;font-style:italic;">No elijas el bolso más impresionante. Elige el que llevarías esta semana.</p>
<p style="margin:0 0 32px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">¿Tienes una cena? El Chanel Mini Flap. ¿Un viaje de trabajo? El Prada Saffiano. ¿Un fin de semana sin planes fijos? El Loewe Gate Mini lo resuelve todo.</p>
<p style="margin:0 0 32px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">Cuando lo tengas claro, la reserva tarda menos de dos minutos.</p>
<table cellpadding="0" cellspacing="0">
  <tr>
    <td style="background:#1a1a2e;padding:16px 40px;">
      <a href="{{app_url}}/catalog" style="color:#c9a96e;font-family:Georgia,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;text-decoration:none;">Ver la colección →</a>
    </td>
  </tr>
</table>
<p style="margin:40px 0 0;font-size:15px;color:#333350;line-height:1.7;font-family:Georgia,serif;font-style:italic;">Con cariño,<br>Erika</p>'),

('membership_onboarding', 3, 'Onboarding — Cómo funciona la entrega (+3 días)', 'Cómo funciona la entrega — para que no haya sorpresas', 72, '
<p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;font-family:Georgia,serif;">Sin sorpresas</p>
<h2 style="margin:0 0 28px;font-size:26px;color:#1a1a2e;font-family:Georgia,serif;font-weight:normal;line-height:1.3;">Cómo funciona<br>la entrega.</h2>
<p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">Antes de que reserves tu primer bolso, quiero contarte exactamente qué pasa después.</p>
<p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">Cuando confirmas tu reserva, nuestro equipo prepara la pieza con el mismo cuidado con el que la recibirías en una boutique. Limpieza, revisión, embalaje. Luego viaja hacia ti en 24-48 horas con mensajería de seguimiento.</p>
<p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">Cuando llegue a tu puerta, encontrarás la pieza envuelta, una tarjeta con instrucciones de cuidado específicas para ese bolso, y el sobre de devolución prepagado para cuando quieras cambiarlo.</p>
<p style="margin:0 0 32px;font-size:16px;color:#1a1a2e;line-height:1.7;font-family:Georgia,serif;font-style:italic;">No tienes que hacer nada especial para devolverlo. Solo avisarnos con 24 horas de antelación y coordinamos la recogida en tu dirección. Así de simple.</p>
<table cellpadding="0" cellspacing="0">
  <tr>
    <td style="background:#1a1a2e;padding:16px 40px;">
      <a href="{{app_url}}/catalog" style="color:#c9a96e;font-family:Georgia,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;text-decoration:none;">Elegir mi primer bolso →</a>
    </td>
  </tr>
</table>
<p style="margin:40px 0 0;font-size:15px;color:#333350;line-height:1.7;font-family:Georgia,serif;font-style:italic;">Con cariño,<br>Erika</p>'),

('membership_onboarding', 4, 'Onboarding — Modo Colecciona (+7 días)', 'Hay algo que quizás no sabes sobre tu membresía', 168, '
<p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;font-family:Georgia,serif;">Modo Colecciona</p>
<h2 style="margin:0 0 28px;font-size:26px;color:#1a1a2e;font-family:Georgia,serif;font-weight:normal;line-height:1.3;">Hay algo que quizás<br>no sabes sobre tu membresía.</h2>
<p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">Llevas una semana con nosotras y quiero contarte algo que muy pocas socias conocen desde el principio.</p>
<p style="margin:0 0 20px;font-size:16px;color:#1a1a2e;line-height:1.7;font-family:Georgia,serif;font-style:italic;">Tu membresía tiene un modo que se llama Colecciona.</p>
<p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">Funciona así: cada mes que formas parte del club, una parte de tu cuota se acumula como crédito hacia la compra de un bolso que elijas. Si algún día decides que quieres quedarte con una pieza para siempre — que quieres poseerla, no solo llevarla — ese crédito está ahí esperándote.</p>
<p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">No es obligatorio. No tienes que decidir nada ahora. Pero es tuyo si algún día lo quieres.</p>
<p style="margin:0 0 32px;font-size:16px;color:#333350;line-height:1.7;font-family:Georgia,serif;">El lujo circular no significa que nunca puedas tener algo propio. Significa que cuando lo tengas, será una decisión consciente — no un impulso.</p>
<table cellpadding="0" cellspacing="0">
  <tr>
    <td style="background:#1a1a2e;padding:16px 40px;">
      <a href="{{app_url}}/dashboard" style="color:#c9a96e;font-family:Georgia,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;text-decoration:none;">Saber más sobre Colecciona →</a>
    </td>
  </tr>
</table>
<p style="margin:40px 0 0;font-size:15px;color:#333350;line-height:1.7;font-family:Georgia,serif;font-style:italic;">Con cariño,<br>Erika</p>');
