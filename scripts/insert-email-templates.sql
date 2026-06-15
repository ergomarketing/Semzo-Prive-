-- SEMZO PRIVÉ — Insertar plantillas de email editoriales luxury
-- Ejecutar en Supabase SQL Editor

-- Crear tabla si no existe
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

-- Limpiar e insertar los 5 emails
delete from email_templates;

insert into email_templates (id, name, subject, delay_days, body_html) values

(1, 'Email 1 — Bienvenida', 'Bienvenida a algo diferente, {{name}}', 0, '
<div style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:4px;color:#c9a96e;font-family:Georgia,serif;text-transform:uppercase;">Membresía privada</p>
            <h1 style="margin:8px 0 0;font-size:28px;letter-spacing:6px;color:#ffffff;font-family:Georgia,serif;font-weight:normal;">SEMZO PRIVÉ</h1>
          </td>
        </tr>

        <!-- HERO IMAGE CON TEXTO -->
        <tr>
          <td style="padding:0;position:relative;">
            <div style="position:relative;background:#1a1a2e;overflow:hidden;">
              <img src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80" alt="Bolso de lujo" width="600" style="display:block;width:100%;opacity:0.6;" />
              <div style="position:absolute;bottom:0;left:0;right:0;padding:40px;text-align:left;">
                <p style="margin:0;font-size:10px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">Bienvenida</p>
                <h2 style="margin:8px 0 0;font-size:32px;color:#ffffff;font-family:Georgia,serif;font-weight:normal;line-height:1.2;">El lujo no se lleva.<br><em>Se elige con criterio.</em></h2>
              </div>
            </div>
          </td>
        </tr>

        <!-- CUERPO -->
        <tr>
          <td style="padding:48px 48px 32px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">{{name}},</p>
            <p style="margin:0 0 24px;font-size:16px;color:#1a1a2e;line-height:1.7;font-family:Georgia,serif;">Acabas de entrar en algo que muy pocas personas conocen. SEMZO Privé no es una tienda. Es una selección.</p>
            <p style="margin:0 0 24px;font-size:16px;color:#1a1a2e;line-height:1.7;font-family:Georgia,serif;">Cada pieza ha pasado por nuestras manos. Hermès, Chanel, Louis Vuitton, Bottega Veneta. Auténticos. Disponibles. Sin lista de espera.</p>
            <p style="margin:0 0 32px;font-size:16px;color:#1a1a2e;line-height:1.7;font-family:Georgia,serif;">Una membresía mensual te da acceso a todo eso. Cámbialo cuando quieras. Hazlo tuyo si te enamoras.</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a1a2e;padding:16px 40px;">
                  <a href="{{cta_url}}" style="color:#c9a96e;font-family:Georgia,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;text-decoration:none;">Explorar la colección</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- SEPARADOR -->
        <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e8e4de;" /></td></tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#1a1a2e;padding:32px 48px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">SEMZO PRIVÉ</p>
            <p style="margin:0 0 16px;font-size:12px;color:#8888aa;line-height:1.6;">Madrid, España</p>
            <p style="margin:0;font-size:11px;color:#555570;">
              <a href="{{unsubscribe_url}}" style="color:#555570;text-decoration:underline;">Darse de baja</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</div>'),

(2, 'Email 2 — Storytelling', 'Hay piezas que no se compran. Se adoptan.', 2, '
<div style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">

        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:4px;color:#c9a96e;font-family:Georgia,serif;text-transform:uppercase;">Membresía privada</p>
            <h1 style="margin:8px 0 0;font-size:28px;letter-spacing:6px;color:#ffffff;font-family:Georgia,serif;font-weight:normal;">SEMZO PRIVÉ</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:0;">
            <div style="background:#1a1a2e;overflow:hidden;">
              <img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80" alt="Chanel Classic Flap" width="600" style="display:block;width:100%;opacity:0.55;" />
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:48px 48px 16px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">Historia</p>
            <h2 style="margin:0 0 24px;font-size:28px;color:#1a1a2e;font-family:Georgia,serif;font-weight:normal;line-height:1.3;">Hay piezas que no<br>se compran. Se adoptan.</h2>
            <p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;">Un Chanel Classic Flap negro no es solo un bolso. Es el resultado de 15 horas de trabajo artesanal, cuero acolchado a mano y una cadena dorada que ha acompañado a algunas de las mujeres más influyentes del siglo XX.</p>
            <p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;">Lista de espera de meses. Precio de cuatro cifras. Disponible para ti, esta semana, con una membresía mensual.</p>
            <p style="margin:0 0 32px;font-size:16px;color:#333350;line-height:1.7;">No porque sea fácil. Sino porque tiene sentido.</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a1a2e;padding:16px 40px;">
                  <a href="{{cta_url}}" style="color:#c9a96e;font-family:Georgia,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;text-decoration:none;">Ver piezas disponibles</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:32px 48px 0;"><hr style="border:none;border-top:1px solid #e8e4de;" /></td></tr>
        <tr>
          <td style="background:#1a1a2e;padding:32px 48px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">SEMZO PRIVÉ</p>
            <p style="margin:0 0 16px;font-size:12px;color:#8888aa;">Madrid, España</p>
            <p style="margin:0;font-size:11px;color:#555570;"><a href="{{unsubscribe_url}}" style="color:#555570;text-decoration:underline;">Darse de baja</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</div>'),

(3, 'Email 3 — Propuesta de valor', '¿Qué incluye una membresía SEMZO Privé?', 4, '
<div style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">

        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:4px;color:#c9a96e;font-family:Georgia,serif;text-transform:uppercase;">Membresía privada</p>
            <h1 style="margin:8px 0 0;font-size:28px;letter-spacing:6px;color:#ffffff;font-family:Georgia,serif;font-weight:normal;">SEMZO PRIVÉ</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:48px 48px 32px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">{{name}}, una aclaración</p>
            <h2 style="margin:0 0 32px;font-size:28px;color:#1a1a2e;font-family:Georgia,serif;font-weight:normal;line-height:1.3;">Todo lo que incluye<br>tu acceso a SEMZO.</h2>

            <!-- BENEFICIO 1 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td width="40" style="vertical-align:top;padding-top:4px;">
                  <div style="width:1px;height:40px;background:#c9a96e;margin-left:0;"></div>
                </td>
                <td style="padding-left:16px;">
                  <p style="margin:0 0 4px;font-size:13px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;">Acceso anticipado</p>
                  <p style="margin:0;font-size:15px;color:#333350;line-height:1.6;">Las nuevas piezas llegan a las socias antes de publicarse. Tú eliges primero.</p>
                </td>
              </tr>
            </table>

            <!-- BENEFICIO 2 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td width="40" style="vertical-align:top;padding-top:4px;">
                  <div style="width:1px;height:40px;background:#c9a96e;margin-left:0;"></div>
                </td>
                <td style="padding-left:16px;">
                  <p style="margin:0 0 4px;font-size:13px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;">Curaduría personal</p>
                  <p style="margin:0;font-size:15px;color:#333350;line-height:1.6;">Cada bolso ha sido revisado, autentificado y preparado por nuestro equipo.</p>
                </td>
              </tr>
            </table>

            <!-- BENEFICIO 3 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td width="40" style="vertical-align:top;padding-top:4px;">
                  <div style="width:1px;height:40px;background:#c9a96e;margin-left:0;"></div>
                </td>
                <td style="padding-left:16px;">
                  <p style="margin:0 0 4px;font-size:13px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;">Sin permanencia</p>
                  <p style="margin:0;font-size:15px;color:#333350;line-height:1.6;">Cancela cuando quieras. Sin compromisos. Sin penalizaciones.</p>
                </td>
              </tr>
            </table>

            <!-- BENEFICIO 4 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
              <tr>
                <td width="40" style="vertical-align:top;padding-top:4px;">
                  <div style="width:1px;height:40px;background:#c9a96e;margin-left:0;"></div>
                </td>
                <td style="padding-left:16px;">
                  <p style="margin:0 0 4px;font-size:13px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;">Comunidad privada</p>
                  <p style="margin:0;font-size:15px;color:#333350;line-height:1.6;">Mujeres con criterio, gusto y una forma de entender el lujo diferente.</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 32px;font-size:16px;color:#1a1a2e;font-family:Georgia,serif;line-height:1.7;font-style:italic;">Desde 59€ al mes. Sin permanencia.</p>

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a1a2e;padding:16px 40px;">
                  <a href="{{cta_url}}" style="color:#c9a96e;font-family:Georgia,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;text-decoration:none;">Activar mi acceso</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e8e4de;" /></td></tr>
        <tr>
          <td style="background:#1a1a2e;padding:32px 48px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">SEMZO PRIVÉ</p>
            <p style="margin:0 0 16px;font-size:12px;color:#8888aa;">Madrid, España</p>
            <p style="margin:0;font-size:11px;color:#555570;"><a href="{{unsubscribe_url}}" style="color:#555570;text-decoration:underline;">Darse de baja</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</div>'),

(4, 'Email 4 — Escasez', 'Esta pieza no va a esperar.', 6, '
<div style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">

        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:4px;color:#c9a96e;font-family:Georgia,serif;text-transform:uppercase;">Membresía privada</p>
            <h1 style="margin:8px 0 0;font-size:28px;letter-spacing:6px;color:#ffffff;font-family:Georgia,serif;font-weight:normal;">SEMZO PRIVÉ</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:0;background:#1a1a2e;">
            <img src="https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80" alt="Bolso de lujo" width="600" style="display:block;width:100%;opacity:0.6;" />
          </td>
        </tr>

        <tr>
          <td style="padding:48px 48px 32px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">Disponibilidad limitada</p>
            <h2 style="margin:0 0 24px;font-size:28px;color:#1a1a2e;font-family:Georgia,serif;font-weight:normal;line-height:1.3;">Prendas como estas<br>no esperan, {{name}}.</h2>
            <p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;">Nuestra colección es limitada y rota continuamente. Algunos modelos solo están disponibles unas semanas antes de pasar a otra socia.</p>
            <p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;">Cuando una Birkin 30 de cuero Togo sale del catálogo, no hay otra igual esperando. Hay criterio. Hay selección. Y hay momento.</p>
            <p style="margin:0 0 32px;font-size:16px;color:#1a1a2e;font-family:Georgia,serif;line-height:1.7;font-style:italic;">Este es el tuyo.</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a1a2e;padding:16px 40px;">
                  <a href="{{cta_url}}" style="color:#c9a96e;font-family:Georgia,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;text-decoration:none;">Ver disponibilidad ahora</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e8e4de;" /></td></tr>
        <tr>
          <td style="background:#1a1a2e;padding:32px 48px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">SEMZO PRIVÉ</p>
            <p style="margin:0 0 16px;font-size:12px;color:#8888aa;">Madrid, España</p>
            <p style="margin:0;font-size:11px;color:#555570;"><a href="{{unsubscribe_url}}" style="color:#555570;text-decoration:underline;">Darse de baja</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</div>'),

(5, 'Email 5 — Cierre', 'Una última cosa, {{name}}.', 10, '
<div style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">

        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:4px;color:#c9a96e;font-family:Georgia,serif;text-transform:uppercase;">Membresía privada</p>
            <h1 style="margin:8px 0 0;font-size:28px;letter-spacing:6px;color:#ffffff;font-family:Georgia,serif;font-weight:normal;">SEMZO PRIVÉ</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:64px 48px 48px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">Para ti, {{name}}</p>
            <h2 style="margin:0 0 32px;font-size:32px;color:#1a1a2e;font-family:Georgia,serif;font-weight:normal;line-height:1.3;">Este es el último<br>mensaje que te envío.</h2>
            <p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;text-align:left;">Si el momento no es ahora, lo entiendo. El lujo real no se fuerza. Y nosotras tampoco lo hacemos.</p>
            <p style="margin:0 0 20px;font-size:16px;color:#333350;line-height:1.7;text-align:left;">Cuando estés lista, estaremos aquí. La colección se renueva cada temporada. Siempre hay algo nuevo esperándote.</p>
            <p style="margin:0 0 48px;font-size:16px;color:#1a1a2e;font-family:Georgia,serif;line-height:1.7;font-style:italic;text-align:left;">Con cariño, el equipo de SEMZO Privé.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#1a1a2e;padding:16px 40px;">
                  <a href="{{cta_url}}" style="color:#c9a96e;font-family:Georgia,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;text-decoration:none;">Unirme a SEMZO Privé</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e8e4de;" /></td></tr>
        <tr>
          <td style="background:#1a1a2e;padding:40px 48px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#c9a96e;text-transform:uppercase;">SEMZO PRIVÉ</p>
            <p style="margin:0 0 4px;font-size:12px;color:#8888aa;">Madrid, España</p>
            <p style="margin:0 0 24px;font-size:12px;color:#8888aa;">semzoprive.com</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
              <tr>
                <td style="padding:0 8px;"><a href="#" style="color:#c9a96e;text-decoration:none;font-size:12px;letter-spacing:2px;">IG</a></td>
                <td style="padding:0 8px;color:#555570;">|</td>
                <td style="padding:0 8px;"><a href="#" style="color:#c9a96e;text-decoration:none;font-size:12px;letter-spacing:2px;">PIN</a></td>
              </tr>
            </table>
            <p style="margin:0;font-size:11px;color:#555570;"><a href="{{unsubscribe_url}}" style="color:#555570;text-decoration:underline;">Darse de baja</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</div>');

-- Verificar
select id, name, delay_days, length(body_html) as html_chars from email_templates order by id;
