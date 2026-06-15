-- Actualizar Email 1 con diseño profesional SEMZO PRIVÉ
UPDATE email_templates SET
  subject = 'Bienvenida a algo diferente, {{name}}',
  body_html = '
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER LOGO -->
  <tr>
    <td align="center" style="background-color:#ffffff;padding:32px 40px 24px;border-bottom:1px solid #e8e4dc;">
      <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dise%C3%B1o%20sin%20t%C3%ADtulo%20%282%29-inkIZEUFPF0EiqRRrgIJhGddxrWGYo.png"
           alt="SEMZO PRIVÉ" width="260" style="display:block;margin:0 auto;" />
      <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:11px;letter-spacing:0.25em;color:#9b8c7a;text-transform:uppercase;">
        Tu puerta de acceso al armario de tus sueños
      </p>
    </td>
  </tr>

  <!-- HERO IMAGE — Membresía Petite -->
  <tr>
    <td style="padding:0;position:relative;">
      <img src="https://semzoprive.com/images/petite-hero.jpg"
           alt="Membresía Petite — SEMZO PRIVÉ"
           width="600"
           style="display:block;width:100%;max-width:600px;height:320px;object-fit:cover;" />
      <!-- Overlay text on image -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="position:absolute;bottom:0;left:0;background:linear-gradient(transparent,rgba(15,14,40,0.75));padding:32px 40px;">
        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#ffffff;letter-spacing:0.04em;line-height:1.3;">
              El lujo no se posee.<br/>Se elige.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background-color:#ffffff;padding:48px 48px 40px;">

      <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:16px;color:#1a1a4b;line-height:1.8;">
        Hola {{name}},
      </p>

      <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;color:#2c2c2c;line-height:1.85;font-style:italic;font-weight:bold;">
        Déjame adivinar.
      </p>

      <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#2c2c2c;line-height:1.85;">
        Probablemente ya has pensado alguna vez en comprar un bolso de diseñador.<br/>
        Y probablemente también te has hecho alguna de estas preguntas:
      </p>

      <!-- Questions block -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border-left:3px solid #c9a96e;margin:24px 0 28px;padding:0;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:14px;color:#555;line-height:1.8;font-style:italic;">
              ¿Lo usaré lo suficiente?<br/>
              ¿Seguiré enamorada de él dentro de seis meses?<br/>
              ¿Realmente merece la pena invertir miles de euros en una sola pieza?
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#2c2c2c;line-height:1.85;">
        La mayoría de las mujeres responde a esas dudas comprando igualmente.<br/>
        <strong>Nosotras decidimos hacerlo de otra manera.</strong>
      </p>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
        <tr>
          <td style="border-top:1px solid #e8e4dc;"></td>
          <td style="width:40px;text-align:center;padding:0 12px;">
            <span style="font-family:Georgia,serif;font-size:18px;color:#c9a96e;">✦</span>
          </td>
          <td style="border-top:1px solid #e8e4dc;"></td>
        </tr>
      </table>

      <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.2em;color:#c9a96e;text-transform:uppercase;">
        La idea detrás de SEMZO PRIVÉ
      </p>
      <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#1a1a4b;line-height:1.4;">
        No necesitas poseer un armario de lujo<br/>para disfrutarlo.
      </p>

      <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:15px;color:#2c2c2c;line-height:1.85;">
        Puedes acceder a él. Cambiar. Probar. Descubrir nuevas piezas.<br/>
        Y elegir lo que encaja contigo en cada momento.
      </p>
      <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:15px;color:#2c2c2c;line-height:1.85;">
        Sin acumular. Sin compras impulsivas. Sin renunciar a la experiencia.
      </p>

      <p style="margin:0 0 32px;font-family:Georgia,serif;font-size:15px;color:#2c2c2c;line-height:1.85;">
        En el siguiente email te cuento por qué cada vez más mujeres están sustituyendo 
        la propiedad por el acceso. Y por qué, una vez lo entiendes, resulta difícil volver atrás.
      </p>

      <p style="margin:0 0 32px;font-family:Georgia,serif;font-size:15px;color:#2c2c2c;line-height:1.85;">
        Mientras tanto, te invito a descubrir la colección.
      </p>

      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" style="margin:0 0 40px;">
        <tr>
          <td style="background-color:#1a1a4b;border-radius:2px;">
            <a href="https://semzoprive.com/catalog"
               style="display:inline-block;padding:16px 40px;font-family:Georgia,serif;font-size:12px;
                      letter-spacing:0.2em;text-transform:uppercase;color:#c9a96e;text-decoration:none;
                      font-weight:400;">
              Explorar la colección
            </a>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr><td style="border-top:1px solid #e8e4dc;"></td></tr>
      </table>

      <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:15px;color:#2c2c2c;line-height:1.85;">
        Bienvenida a SEMZO PRIVÉ.
      </p>
      <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#1a1a4b;">
        Erika
      </p>
      <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:13px;color:#9b8c7a;font-style:italic;">
        Fundadora de SEMZO PRIVÉ
      </p>

      <!-- PS -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background-color:#f5f4f0;border-radius:4px;margin:0;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:13px;color:#555;line-height:1.8;font-style:italic;">
              <strong>P.D.</strong> La mayoría de las personas cree que el lujo consiste en tener más. 
              Nosotras creemos que consiste en elegir mejor.
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background-color:#1a1a4b;padding:40px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dise%C3%B1o%20sin%20t%C3%ADtulo%20%282%29-inkIZEUFPF0EiqRRrgIJhGddxrWGYo.png"
                 alt="SEMZO PRIVÉ" width="160"
                 style="display:block;margin:0 auto 20px;filter:brightness(0) invert(1);" />
            <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:11px;letter-spacing:0.2em;
                      color:#c9a96e;text-transform:uppercase;">
              Madrid, España
            </p>
            <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:11px;color:#8899aa;line-height:1.6;">
              <a href="https://semzoprive.com" style="color:#8899aa;text-decoration:none;">semzoprive.com</a>
            </p>
            <!-- Social -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
              <tr>
                <td style="padding:0 8px;">
                  <a href="https://instagram.com/semzoprive" style="color:#8899aa;text-decoration:none;font-family:Georgia,serif;font-size:11px;letter-spacing:0.1em;">
                    INSTAGRAM
                  </a>
                </td>
                <td style="padding:0 8px;color:#c9a96e;">·</td>
                <td style="padding:0 8px;">
                  <a href="https://semzoprive.com" style="color:#8899aa;text-decoration:none;font-family:Georgia,serif;font-size:11px;letter-spacing:0.1em;">
                    WEB
                  </a>
                </td>
              </tr>
            </table>
            <!-- Unsubscribe -->
            <p style="margin:0;font-family:Georgia,serif;font-size:11px;color:#556677;line-height:1.6;">
              <a href="{{unsubscribe_url}}" style="color:#556677;text-decoration:underline;">
                Darse de baja
              </a>
              &nbsp;·&nbsp;
              © 2026 SEMZO PRIVÉ. Todos los derechos reservados.
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
</body>
</html>',
  updated_at = now()
WHERE id = 1;

SELECT id, name, subject FROM email_templates WHERE id = 1;
