-- ============================================================
-- SEMZO PRIVÉ — Plantillas de email editoriales estilo luxury
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Crear tabla si no existe (por si acaso)
create table if not exists email_templates (
  id integer primary key check (id between 1 and 5),
  name text not null,
  subject text not null,
  body_html text not null,
  delay_days integer not null default 0,
  active boolean default true,
  updated_at timestamptz default now()
);

alter table email_templates enable row level security;

drop policy if exists "service_role_all_templates" on email_templates;
create policy "service_role_all_templates" on email_templates
  for all using (auth.role() = 'service_role');

-- ============================================================
-- EMAIL 1 — Bienvenida (inmediato)
-- ============================================================
insert into email_templates (id, name, subject, delay_days, body_html) values (1,
'Email 1 — Bienvenida',
'Bienvenida a algo diferente, {{name}}',
0,
'<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SEMZO PRIVÉ</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td align="center" style="padding:40px 0 32px;">
    <p style="margin:0;font-size:11px;letter-spacing:0.35em;color:#9a8c7e;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Membresía de bolsos de lujo</p>
    <h1 style="margin:10px 0 0;font-size:36px;letter-spacing:0.15em;color:#1a1a2e;font-weight:400;text-transform:uppercase;font-family:Georgia,serif;">SEMZO PRIVÉ</h1>
    <div style="margin:18px auto 0;width:40px;height:1px;background-color:#c9a96e;"></div>
  </td></tr>

  <!-- HERO IMAGE -->
  <tr><td style="padding:0 24px;">
    <div style="position:relative;background-color:#1a1a2e;background-image:url(https://semzoprive.com/images/hermes-prive.jpeg);background-size:cover;background-position:center top;min-height:380px;text-align:center;padding:60px 40px;">
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(26,26,46,0.3) 0%,rgba(26,26,46,0.65) 100%);"></div>
      <div style="position:relative;z-index:1;">
        <p style="margin:0 0 12px;font-size:10px;letter-spacing:0.4em;color:rgba(255,255,255,0.75);text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Acceso exclusivo</p>
        <h2 style="margin:0;font-size:38px;line-height:1.1;color:#ffffff;font-weight:400;font-family:Georgia,serif;font-style:italic;">El lujo no se lleva.<br>Se elige con criterio.</h2>
      </div>
    </div>
  </td></tr>

  <!-- BODY TEXT -->
  <tr><td style="padding:40px 48px 32px;background-color:#ffffff;margin:0 24px;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.3em;color:#c9a96e;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Hola, {{name}}</p>
    <h3 style="margin:10px 0 20px;font-size:24px;font-weight:400;color:#1a1a2e;line-height:1.3;font-family:Georgia,serif;">Acabas de entrar en algo que muy pocas mujeres conocen.</h3>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#4a4a5a;font-family:Helvetica,Arial,sans-serif;">SEMZO Privé no es una tienda. Es una selección. Hermès, Chanel, Louis Vuitton — auténticos, revisados, disponibles para ti por una membresía mensual.</p>
    <p style="margin:0 0 32px;font-size:15px;line-height:1.8;color:#4a4a5a;font-family:Helvetica,Arial,sans-serif;">No hay permanencia. No hay compromiso. Solo acceso a piezas que normalmente esperarías meses en conseguir.</p>
    <div style="text-align:center;">
      <a href="{{cta_url}}" style="display:inline-block;background-color:#1a1a2e;color:#ffffff;text-decoration:none;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;padding:16px 40px;font-family:Helvetica,Arial,sans-serif;">EXPLORAR LA COLECCIÓN</a>
    </div>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:32px 48px 0;background-color:#ffffff;">
    <div style="height:1px;background-color:#f0ece6;"></div>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;">
      <tr><td style="padding:36px 48px;text-align:center;">
        <p style="margin:0 0 8px;font-size:14px;letter-spacing:0.2em;color:#ffffff;text-transform:uppercase;font-family:Georgia,serif;">SEMZO PRIVÉ</p>
        <p style="margin:0 0 16px;font-size:11px;color:rgba(255,255,255,0.45);font-family:Helvetica,Arial,sans-serif;letter-spacing:0.05em;">Madrid, España</p>
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);font-family:Helvetica,Arial,sans-serif;">
          <a href="{{unsubscribe_url}}" style="color:rgba(255,255,255,0.45);text-decoration:underline;">Darse de baja</a>
          &nbsp;&middot;&nbsp;
          <a href="https://semzoprive.com" style="color:rgba(255,255,255,0.45);text-decoration:none;">semzoprive.com</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>')
on conflict (id) do update set subject=excluded.subject, body_html=excluded.body_html, delay_days=excluded.delay_days, updated_at=now();

-- ============================================================
-- EMAIL 2 — Storytelling (día 2)
-- ============================================================
insert into email_templates (id, name, subject, delay_days, body_html) values (2,
'Email 2 — Storytelling',
'Hay piezas que no se compran. Se adoptan.',
2,
'<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td align="center" style="padding:40px 0 32px;">
    <h1 style="margin:0;font-size:32px;letter-spacing:0.15em;color:#1a1a2e;font-weight:400;text-transform:uppercase;font-family:Georgia,serif;">SEMZO PRIVÉ</h1>
    <div style="margin:14px auto 0;width:40px;height:1px;background-color:#c9a96e;"></div>
  </td></tr>

  <!-- EDITORIAL HEADLINE -->
  <tr><td style="padding:0 24px;">
    <div style="background-color:#1a1a2e;padding:56px 48px;text-align:center;">
      <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.4em;color:#c9a96e;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Historia</p>
      <h2 style="margin:0;font-size:40px;line-height:1.1;color:#ffffff;font-weight:400;font-family:Georgia,serif;font-style:italic;">Hay piezas que<br>no se compran.<br>Se adoptan.</h2>
    </div>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:40px 48px 32px;background-color:#ffffff;">
    <p style="margin:0 0 20px;font-size:15px;line-height:1.85;color:#4a4a5a;font-family:Helvetica,Arial,sans-serif;">Un Chanel Classic Flap negro no es solo un bolso. Es el resultado de 15 horas de trabajo artesanal, materiales seleccionados a mano y una lista de espera de meses.</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.85;color:#4a4a5a;font-family:Helvetica,Arial,sans-serif;">En SEMZO Privé creemos que deberías poder llevarlo esta semana. Sin esperar, sin comprometerte de por vida. Porque el lujo real es el acceso, no la acumulación.</p>
    <p style="margin:0 0 32px;font-size:15px;line-height:1.85;color:#1a1a2e;font-family:Georgia,serif;font-style:italic;">"La moda pasa, el estilo permanece." — Coco Chanel</p>
    <div style="text-align:center;">
      <a href="{{cta_url}}" style="display:inline-block;background-color:#1a1a2e;color:#ffffff;text-decoration:none;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;padding:16px 40px;font-family:Helvetica,Arial,sans-serif;">VER LAS PIEZAS DISPONIBLES</a>
    </div>
  </td></tr>

  <!-- FOOTER -->
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;">
      <tr><td style="padding:32px 48px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.2em;color:#ffffff;text-transform:uppercase;font-family:Georgia,serif;">SEMZO PRIVÉ</p>
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);font-family:Helvetica,Arial,sans-serif;">
          <a href="{{unsubscribe_url}}" style="color:rgba(255,255,255,0.45);text-decoration:underline;">Darse de baja</a>
          &nbsp;&middot;&nbsp;
          <a href="https://semzoprive.com" style="color:rgba(255,255,255,0.45);text-decoration:none;">semzoprive.com</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>')
on conflict (id) do update set subject=excluded.subject, body_html=excluded.body_html, delay_days=excluded.delay_days, updated_at=now();

-- ============================================================
-- EMAIL 3 — Propuesta de valor (día 4)
-- ============================================================
insert into email_templates (id, name, subject, delay_days, body_html) values (3,
'Email 3 — Propuesta de valor',
'¿Qué incluye realmente una membresía SEMZO?',
4,
'<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td align="center" style="padding:40px 0 32px;">
    <h1 style="margin:0;font-size:32px;letter-spacing:0.15em;color:#1a1a2e;font-weight:400;text-transform:uppercase;font-family:Georgia,serif;">SEMZO PRIVÉ</h1>
    <div style="margin:14px auto 0;width:40px;height:1px;background-color:#c9a96e;"></div>
  </td></tr>

  <!-- HEADLINE -->
  <tr><td style="padding:0 24px;">
    <div style="background-color:#c9a96e;padding:48px;text-align:center;">
      <p style="margin:0 0 12px;font-size:10px;letter-spacing:0.4em;color:rgba(255,255,255,0.8);text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Lo que incluye</p>
      <h2 style="margin:0;font-size:36px;line-height:1.15;color:#ffffff;font-weight:400;font-family:Georgia,serif;">Una membresía.<br><span style="font-style:italic;">Acceso ilimitado.</span></h2>
    </div>
  </td></tr>

  <!-- BENEFITS -->
  <tr><td style="background-color:#ffffff;padding:40px 48px;">
    <p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#4a4a5a;font-family:Helvetica,Arial,sans-serif;">Hola {{name}}, esto es lo que obtienes desde el primer día:</p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #f0ece6;vertical-align:top;width:32px;">
          <div style="width:24px;height:24px;background-color:#1a1a2e;border-radius:50%;text-align:center;line-height:24px;color:#ffffff;font-size:11px;font-family:Helvetica,Arial,sans-serif;">1</div>
        </td>
        <td style="padding:16px 0 16px 16px;border-bottom:1px solid #f0ece6;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a1a2e;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.05em;text-transform:uppercase;">Acceso a bolsos de primeras firmas</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#6b6b7b;font-family:Helvetica,Arial,sans-serif;">Hermès, Chanel, Louis Vuitton, Dior y más. Auténticos y verificados.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #f0ece6;vertical-align:top;">
          <div style="width:24px;height:24px;background-color:#1a1a2e;border-radius:50%;text-align:center;line-height:24px;color:#ffffff;font-size:11px;font-family:Helvetica,Arial,sans-serif;">2</div>
        </td>
        <td style="padding:16px 0 16px 16px;border-bottom:1px solid #f0ece6;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a1a2e;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.05em;text-transform:uppercase;">Envío y devolución gratuitos</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#6b6b7b;font-family:Helvetica,Arial,sans-serif;">Lo recibimos en tu puerta. Lo devolvemos nosotras cuando lo indiques.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #f0ece6;vertical-align:top;">
          <div style="width:24px;height:24px;background-color:#1a1a2e;border-radius:50%;text-align:center;line-height:24px;color:#ffffff;font-size:11px;font-family:Helvetica,Arial,sans-serif;">3</div>
        </td>
        <td style="padding:16px 0 16px 16px;border-bottom:1px solid #f0ece6;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a1a2e;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.05em;text-transform:uppercase;">Seguro incluido</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#6b6b7b;font-family:Helvetica,Arial,sans-serif;">Cada pieza está asegurada. Tú solo disfrútala.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 0;vertical-align:top;">
          <div style="width:24px;height:24px;background-color:#c9a96e;border-radius:50%;text-align:center;line-height:24px;color:#ffffff;font-size:11px;font-family:Helvetica,Arial,sans-serif;">4</div>
        </td>
        <td style="padding:16px 0 16px 16px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a1a2e;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.05em;text-transform:uppercase;">Opción de compra</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#6b6b7b;font-family:Helvetica,Arial,sans-serif;">Si te enamoras, puedes adquirirla con precio especial de socia.</p>
        </td>
      </tr>
    </table>

    <div style="margin-top:36px;text-align:center;">
      <p style="margin:0 0 6px;font-size:22px;font-weight:400;color:#1a1a2e;font-family:Georgia,serif;">Desde <strong style="color:#c9a96e;">59€/mes</strong></p>
      <p style="margin:0 0 24px;font-size:12px;color:#9a8c7e;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.05em;">Sin permanencia. Cancela cuando quieras.</p>
      <a href="{{cta_url}}" style="display:inline-block;background-color:#1a1a2e;color:#ffffff;text-decoration:none;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;padding:16px 40px;font-family:Helvetica,Arial,sans-serif;">ACTIVAR MI ACCESO</a>
    </div>
  </td></tr>

  <!-- FOOTER -->
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;">
      <tr><td style="padding:32px 48px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.2em;color:#ffffff;text-transform:uppercase;font-family:Georgia,serif;">SEMZO PRIVÉ</p>
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);font-family:Helvetica,Arial,sans-serif;">
          <a href="{{unsubscribe_url}}" style="color:rgba(255,255,255,0.45);text-decoration:underline;">Darse de baja</a>
          &nbsp;&middot;&nbsp;
          <a href="https://semzoprive.com" style="color:rgba(255,255,255,0.45);text-decoration:none;">semzoprive.com</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>')
on conflict (id) do update set subject=excluded.subject, body_html=excluded.body_html, delay_days=excluded.delay_days, updated_at=now();

-- ============================================================
-- EMAIL 4 — Escasez (día 6)
-- ============================================================
insert into email_templates (id, name, subject, delay_days, body_html) values (4,
'Email 4 — Escasez',
'Piezas como estas no esperan, {{name}}',
6,
'<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td align="center" style="padding:40px 0 32px;">
    <h1 style="margin:0;font-size:32px;letter-spacing:0.15em;color:#1a1a2e;font-weight:400;text-transform:uppercase;font-family:Georgia,serif;">SEMZO PRIVÉ</h1>
    <div style="margin:14px auto 0;width:40px;height:1px;background-color:#c9a96e;"></div>
  </td></tr>

  <!-- URGENCY BAND -->
  <tr><td style="padding:0 24px;">
    <div style="background-color:#1a1a2e;padding:14px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;letter-spacing:0.35em;color:#c9a96e;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Disponibilidad limitada</p>
    </div>
  </td></tr>

  <!-- HEADLINE BLOCK -->
  <tr><td style="padding:0 24px;">
    <div style="background-color:#ffffff;padding:48px 48px 40px;">
      <h2 style="margin:0 0 20px;font-size:36px;line-height:1.15;color:#1a1a2e;font-weight:400;font-family:Georgia,serif;font-style:italic;">Piezas como estas<br>no esperan.</h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.85;color:#4a4a5a;font-family:Helvetica,Arial,sans-serif;">Hola {{name}}, nuestra colección es limitada y rotativa. Algunos modelos solo están disponibles unas semanas antes de pasar a otra socia.</p>
      <p style="margin:0 0 32px;font-size:15px;line-height:1.85;color:#4a4a5a;font-family:Helvetica,Arial,sans-serif;">Cuando un Fendi Baguette o un Hermès Kelly sale de la colección, no hay garantías de cuándo vuelve — si es que vuelve.</p>

      <!-- AVAILABILITY BOX -->
      <div style="background-color:#f5f4f0;border-left:3px solid #c9a96e;padding:20px 24px;margin-bottom:32px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;color:#c9a96e;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">En este momento</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#1a1a2e;font-family:Helvetica,Arial,sans-serif;">Hermès, Chanel, Louis Vuitton, Dior · Colección activa · Plazas abiertas</p>
      </div>

      <div style="text-align:center;">
        <a href="{{cta_url}}" style="display:inline-block;background-color:#1a1a2e;color:#ffffff;text-decoration:none;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;padding:16px 40px;font-family:Helvetica,Arial,sans-serif;">VER DISPONIBILIDAD</a>
      </div>
    </div>
  </td></tr>

  <!-- FOOTER -->
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;">
      <tr><td style="padding:32px 48px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.2em;color:#ffffff;text-transform:uppercase;font-family:Georgia,serif;">SEMZO PRIVÉ</p>
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);font-family:Helvetica,Arial,sans-serif;">
          <a href="{{unsubscribe_url}}" style="color:rgba(255,255,255,0.45);text-decoration:underline;">Darse de baja</a>
          &nbsp;&middot;&nbsp;
          <a href="https://semzoprive.com" style="color:rgba(255,255,255,0.45);text-decoration:none;">semzoprive.com</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>')
on conflict (id) do update set subject=excluded.subject, body_html=excluded.body_html, delay_days=excluded.delay_days, updated_at=now();

-- ============================================================
-- EMAIL 5 — Cierre (día 10)
-- ============================================================
insert into email_templates (id, name, subject, delay_days, body_html) values (5,
'Email 5 — Cierre',
'Una última cosa, {{name}}',
10,
'<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td align="center" style="padding:40px 0 32px;">
    <h1 style="margin:0;font-size:32px;letter-spacing:0.15em;color:#1a1a2e;font-weight:400;text-transform:uppercase;font-family:Georgia,serif;">SEMZO PRIVÉ</h1>
    <div style="margin:14px auto 0;width:40px;height:1px;background-color:#c9a96e;"></div>
  </td></tr>

  <!-- CLOSING BLOCK -->
  <tr><td style="padding:0 24px;">
    <div style="background-color:#ffffff;padding:56px 48px;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.3em;color:#c9a96e;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Último mensaje</p>
      <h2 style="margin:0 0 28px;font-size:36px;line-height:1.15;color:#1a1a2e;font-weight:400;font-family:Georgia,serif;">{{name}},<br><span style="font-style:italic;">este es nuestro<br>último mensaje.</span></h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.85;color:#4a4a5a;font-family:Helvetica,Arial,sans-serif;">Si el momento no es ahora, lo entendemos. El lujo también es saber esperar.</p>
      <p style="margin:0 0 40px;font-size:15px;line-height:1.85;color:#4a4a5a;font-family:Helvetica,Arial,sans-serif;">Cuando estés lista, estaremos aquí. La colección se renueva cada temporada y siempre hay algo nuevo esperándote.</p>

      <!-- FINAL CTA -->
      <div style="border:1px solid #1a1a2e;padding:32px;text-align:center;margin-bottom:0;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.3em;color:#9a8c7e;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Acceso disponible</p>
        <p style="margin:0 0 20px;font-size:22px;font-weight:400;color:#1a1a2e;font-family:Georgia,serif;font-style:italic;">Membresías desde 59€/mes</p>
        <a href="{{cta_url}}" style="display:inline-block;background-color:#1a1a2e;color:#ffffff;text-decoration:none;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;padding:16px 40px;font-family:Helvetica,Arial,sans-serif;">UNIRME A SEMZO PRIVÉ</a>
      </div>
    </div>
  </td></tr>

  <!-- FOOTER -->
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;">
      <tr><td style="padding:36px 48px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.2em;color:#ffffff;text-transform:uppercase;font-family:Georgia,serif;">SEMZO PRIVÉ</p>
        <p style="margin:0 0 16px;font-size:11px;color:rgba(255,255,255,0.45);font-family:Helvetica,Arial,sans-serif;">Madrid, España</p>
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);font-family:Helvetica,Arial,sans-serif;">
          <a href="{{unsubscribe_url}}" style="color:rgba(255,255,255,0.45);text-decoration:underline;">Darse de baja</a>
          &nbsp;&middot;&nbsp;
          <a href="https://semzoprive.com" style="color:rgba(255,255,255,0.45);text-decoration:none;">semzoprive.com</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>')
on conflict (id) do update set subject=excluded.subject, body_html=excluded.body_html, delay_days=excluded.delay_days, updated_at=now();
