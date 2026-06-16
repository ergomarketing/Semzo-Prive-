-- SEMZO PRIVÉ — Email 1 Bienvenida (rediseñado)
-- Ejecutar en Supabase SQL Editor

UPDATE email_templates SET
  subject = 'Bienvenida a algo diferente, {{name}}',
  delay_days = 0,
  active = true,
  updated_at = now(),
  body_html = '
<div style="margin:0;padding:0;background-color:#f2f0eb;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f0eb;">
<tr><td align="center" style="padding:0;">
<table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#ffffff;">

  <!-- HEADER LOGO -->
  <tr>
    <td align="center" style="padding:36px 40px 24px 40px;background:#ffffff;">
      <img src="https://semzoprive.com/images/logo-semzo-prive.png"
           alt="SEMZO PRIVE" width="260"
           style="display:block;max-width:260px;height:auto;" />
    </td>
  </tr>

  <!-- HERO IMAGE -->
  <tr>
    <td style="padding:0;margin:0;">
      <img src="https://semzoprive.com/images/memberships/petite-membership.jpg"
           alt="Membresía Petite SEMZO PRIVÉ"
           width="620"
           style="display:block;width:100%;max-width:620px;height:auto;" />
    </td>
  </tr>

  <!-- SLOGAN SOBRE FONDO MARINO (debajo de la imagen, superpuesto visualmente) -->
  <tr>
    <td align="center" style="background:#1a1a4b;padding:32px 40px 36px 40px;">
      <p style="margin:0;font-family:Georgia,''Times New Roman'',serif;
                font-size:28px;font-weight:400;line-height:1.35;
                color:#ffffff;letter-spacing:0.02em;text-align:center;">
        Tu puerta de acceso al<br>
        <em style="color:#c9a96e;font-size:30px;">armario de tus sueños</em>
      </p>
    </td>
  </tr>

  <!-- CUERPO -->
  <tr>
    <td style="padding:44px 48px 0 48px;background:#ffffff;">

      <p style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:16px;color:#1a1a4b;line-height:1.8;">
        Hola <strong>{{name}}</strong>,
      </p>

      <p style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:16px;color:#1a1a4b;line-height:1.8;font-style:italic;">
        Déjame adivinar.
      </p>

      <p style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:16px;color:#1a1a4b;line-height:1.8;">
        Probablemente ya has pensado alguna vez en comprar un bolso de diseñador.
        Y probablemente también te has hecho alguna de estas preguntas:
      </p>

      <!-- PREGUNTAS CON ACENTO DORADO -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
        <tr>
          <td style="border-left:3px solid #c9a96e;background:#faf9f6;padding:20px 24px;">
            <p style="margin:0 0 10px 0;font-family:Georgia,serif;font-size:15px;color:#1a1a4b;font-style:italic;line-height:1.7;">¿Lo usaré lo suficiente?</p>
            <p style="margin:0 0 10px 0;font-family:Georgia,serif;font-size:15px;color:#1a1a4b;font-style:italic;line-height:1.7;">¿Seguiré enamorada de él dentro de seis meses?</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#1a1a4b;font-style:italic;line-height:1.7;">¿Realmente merece la pena invertir miles de euros en una sola pieza?</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:16px;color:#1a1a4b;line-height:1.8;">
        La mayoría de las mujeres responde a esas dudas comprando igualmente.
        Nosotras decidimos hacerlo de otra manera.
      </p>

      <p style="margin:32px 0 16px 0;font-family:Georgia,serif;font-size:22px;font-weight:400;
                color:#1a1a4b;letter-spacing:0.03em;line-height:1.3;
                border-bottom:1px solid #e8e4dc;padding-bottom:16px;">
        SEMZO PRIVÉ nace de una idea muy simple:
      </p>

      <p style="margin:0 0 12px 0;font-family:Georgia,serif;font-size:16px;color:#1a1a4b;line-height:1.8;">
        No necesitas poseer un armario de lujo para disfrutarlo.
      </p>
      <p style="margin:0 0 12px 0;font-family:Georgia,serif;font-size:16px;color:#1a1a4b;line-height:1.8;">
        Puedes acceder a él. Cambiar. Probar. Descubrir nuevas piezas.
        Y elegir lo que encaja contigo en cada momento.
      </p>
      <p style="margin:0 0 24px 0;font-family:Georgia,serif;font-size:16px;color:#c9a96e;font-style:italic;line-height:1.8;">
        Sin acumular. Sin compras impulsivas. Sin renunciar a la experiencia.
      </p>

      <p style="margin:0 0 32px 0;font-family:Georgia,serif;font-size:16px;color:#1a1a4b;line-height:1.8;">
        En el siguiente email te cuento por qué cada vez más mujeres están
        sustituyendo la propiedad por el acceso. Y por qué, una vez lo entiendes,
        resulta difícil volver atrás.
      </p>

      <p style="margin:0 0 36px 0;font-family:Georgia,serif;font-size:16px;color:#1a1a4b;line-height:1.8;">
        Mientras tanto, te invito a descubrir la colección.
      </p>

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 44px 0;">
        <tr>
          <td align="center" style="background:#1a1a4b;">
            <a href="https://semzoprive.com/catalog"
               style="display:inline-block;padding:18px 44px;
                      font-family:''Helvetica Neue'',Arial,sans-serif;
                      font-size:12px;font-weight:600;letter-spacing:0.2em;
                      color:#c9a96e;text-decoration:none;text-transform:uppercase;">
              EXPLORAR LA COLECCIÓN
            </a>
          </td>
        </tr>
      </table>

      <!-- SEPARADOR -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
        <tr><td style="height:1px;background:#e8e4dc;font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>

      <!-- FIRMA -->
      <p style="margin:0 0 4px 0;font-family:Georgia,serif;font-size:15px;color:#1a1a4b;line-height:1.7;">
        Bienvenida a SEMZO PRIVÉ.
      </p>
      <p style="margin:0 0 2px 0;font-family:Georgia,serif;font-size:20px;font-weight:700;color:#1a1a4b;">
        Erika
      </p>
      <p style="margin:0 0 36px 0;font-family:Georgia,serif;font-size:13px;color:#999;font-style:italic;">
        Fundadora de SEMZO PRIVÉ
      </p>

      <!-- PD -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 0 0;background:#f7f5f0;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#666;line-height:1.7;font-style:italic;">
              <strong style="color:#1a1a4b;">P.D.</strong>
              La mayoría de las personas cree que el lujo consiste en tener más.
              Nosotras creemos que consiste en elegir mejor.
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#1a1a4b;padding:40px 40px 32px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding-bottom:12px;">
            <p style="margin:0;font-family:''Helvetica Neue'',Arial,sans-serif;
                      font-size:16px;font-weight:700;letter-spacing:0.25em;
                      color:#ffffff;text-transform:uppercase;">
              SEMZO PRIVÉ
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom:16px;">
            <p style="margin:0;font-family:''Helvetica Neue'',Arial,sans-serif;
                      font-size:11px;letter-spacing:0.15em;color:#c9a96e;text-transform:uppercase;">
              MARBELLA, ESPAÑA
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom:20px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 12px;">
                  <a href="https://instagram.com/semzoprive"
                     style="font-family:''Helvetica Neue'',Arial,sans-serif;font-size:11px;
                            letter-spacing:0.12em;color:#c9a96e;text-decoration:none;text-transform:uppercase;">
                    INSTAGRAM
                  </a>
                </td>
                <td style="color:#555;font-size:11px;">·</td>
                <td style="padding:0 12px;">
                  <a href="https://semzoprive.com"
                     style="font-family:''Helvetica Neue'',Arial,sans-serif;font-size:11px;
                            letter-spacing:0.12em;color:#c9a96e;text-decoration:none;text-transform:uppercase;">
                    SEMZOPRIVE.COM
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="border-top:1px solid #2d2d5c;padding-top:20px;">
            <p style="margin:0;font-family:''Helvetica Neue'',Arial,sans-serif;font-size:11px;color:#666;line-height:1.6;">
              <a href="{{unsubscribe_url}}" style="color:#999;text-decoration:underline;">Darse de baja</a>
              &nbsp;·&nbsp;© 2026 SEMZO PRIVÉ
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
{{tracking_pixel}}
</div>
'
WHERE id = 1;
