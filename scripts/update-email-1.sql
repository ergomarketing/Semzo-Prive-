UPDATE email_templates SET
  subject = 'Bienvenida a algo diferente, {{name}}',
  body_html = '<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:Georgia,''Times New Roman'',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;">

  <!-- LOGO HEADER -->
  <tr>
    <td align="center" style="background:#ffffff;padding:36px 40px 20px;border-bottom:1px solid #ece8e1;">
      <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dise%C3%B1o%20sin%20t%C3%ADtulo%20%282%29-inkIZEUFPF0EiqRRrgIJhGddxrWGYo.png"
           alt="SEMZO PRIVÉ" width="240" style="display:block;margin:0 auto;" />
      <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:10px;letter-spacing:0.3em;
                color:#c9a96e;text-transform:uppercase;text-align:center;">
        Tu puerta de acceso al armario de tus sueños
      </p>
    </td>
  </tr>

  <!-- HERO IMAGE -->
  <tr>
    <td style="padding:0;background:#1a1a4b;text-align:center;">
      <img src="https://semzoprive.com/images/petite-membership.jpg"
           alt="Membresía Petite" width="600"
           style="display:block;width:100%;max-width:600px;height:300px;object-fit:cover;opacity:0.85;" />
      <p style="margin:-60px 0 0;padding:0 40px 32px;font-family:Georgia,serif;font-size:26px;
                font-weight:400;color:#ffffff;letter-spacing:0.04em;line-height:1.35;
                text-shadow:0 2px 8px rgba(0,0,0,0.5);">
        El lujo no se posee.<br/><em>Se elige.</em>
      </p>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background:#ffffff;padding:48px 52px 44px;">

      <p style="margin:0 0 24px;font-size:16px;color:#1a1a4b;line-height:1.9;">
        Hola <strong>{{name}}</strong>,
      </p>

      <p style="margin:0 0 20px;font-size:16px;color:#2c2c2c;line-height:1.9;font-style:italic;">
        Déjame adivinar.
      </p>

      <p style="margin:0 0 20px;font-size:15px;color:#2c2c2c;line-height:1.9;">
        Probablemente ya has pensado alguna vez en comprar un bolso de diseñador.
        Y probablemente también te has hecho alguna de estas preguntas:
      </p>

      <!-- Questions -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr>
          <td style="border-left:3px solid #c9a96e;padding:16px 20px;background:#faf9f7;">
            <p style="margin:0;font-size:14px;color:#555;line-height:2;font-style:italic;">
              ¿Lo usaré lo suficiente?<br/>
              ¿Seguiré enamorada de él dentro de seis meses?<br/>
              ¿Realmente merece la pena invertir miles de euros en una sola pieza?
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 20px;font-size:15px;color:#2c2c2c;line-height:1.9;">
        La mayoría de las mujeres responde a esas dudas comprando igualmente.<br/>
        <strong style="color:#1a1a4b;">Nosotras decidimos hacerlo de otra manera.</strong>
      </p>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:36px 0 32px;">
        <tr>
          <td style="border-top:1px solid #ece8e1;width:45%;"></td>
          <td align="center" style="width:10%;color:#c9a96e;font-size:18px;padding:0 10px;">✦</td>
          <td style="border-top:1px solid #ece8e1;width:45%;"></td>
        </tr>
      </table>

      <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.25em;color:#c9a96e;text-transform:uppercase;">
        La idea detrás de SEMZO PRIVÉ
      </p>
      <p style="margin:0 0 20px;font-size:24px;font-weight:400;color:#1a1a4b;line-height:1.4;">
        No necesitas poseer un armario de lujo<br/>para disfrutarlo.
      </p>

      <p style="margin:0 0 16px;font-size:15px;color:#2c2c2c;line-height:1.9;">
        Puedes acceder a él. Cambiar. Probar. Descubrir nuevas piezas.
        Y elegir lo que encaja contigo en cada momento.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#2c2c2c;line-height:1.9;">
        Sin acumular. Sin compras impulsivas. Sin renunciar a la experiencia.
      </p>

      <p style="margin:0 0 32px;font-size:15px;color:#2c2c2c;line-height:1.9;">
        En el siguiente email te cuento por qué cada vez más mujeres están sustituyendo
        la propiedad por el acceso. Y por qué, una vez lo entiendes, resulta difícil volver atrás.
      </p>

      <p style="margin:0 0 36px;font-size:15px;color:#2c2c2c;line-height:1.9;">
        Mientras tanto, te invito a descubrir la colección.
      </p>

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0" style="margin:0 0 44px;">
        <tr>
          <td style="background:#1a1a4b;">
            <a href="https://semzoprive.com/catalog"
               style="display:inline-block;padding:16px 44px;font-family:Georgia,serif;
                      font-size:11px;letter-spacing:0.22em;text-transform:uppercase;
                      color:#c9a96e;text-decoration:none;">
              Explorar la colección
            </a>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr><td style="border-top:1px solid #ece8e1;"></td></tr>
      </table>

      <p style="margin:0 0 4px;font-size:15px;color:#2c2c2c;line-height:1.9;">
        Bienvenida a SEMZO PRIVÉ.
      </p>
      <p style="margin:0 0 2px;font-size:17px;font-weight:bold;color:#1a1a4b;">Erika</p>
      <p style="margin:0 0 28px;font-size:12px;color:#9b8c7a;font-style:italic;">
        Fundadora de SEMZO PRIVÉ
      </p>

      <!-- PS -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#f5f4f0;padding:18px 22px;">
            <p style="margin:0;font-size:13px;color:#555;line-height:1.85;font-style:italic;">
              <strong>P.D.</strong> La mayoría de las personas cree que el lujo consiste en tener más.
              Nosotras creemos que consiste en <em>elegir mejor</em>.
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#1a1a4b;padding:44px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:18px;font-weight:400;
                      letter-spacing:0.15em;color:#ffffff;text-transform:uppercase;">
              SEMZO PRIVÉ
            </p>
            <p style="margin:0 0 20px;font-size:10px;letter-spacing:0.2em;color:#c9a96e;text-transform:uppercase;">
              Madrid, España
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
              <tr>
                <td>
                  <a href="https://instagram.com/semzoprive"
                     style="font-size:10px;letter-spacing:0.15em;color:#8899aa;text-decoration:none;text-transform:uppercase;">
                    Instagram
                  </a>
                </td>
                <td style="padding:0 12px;color:#c9a96e;font-size:10px;">·</td>
                <td>
                  <a href="https://semzoprive.com"
                     style="font-size:10px;letter-spacing:0.15em;color:#8899aa;text-decoration:none;text-transform:uppercase;">
                    semzoprive.com
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:11px;color:#4a5a6a;line-height:1.7;">
              <a href="{{unsubscribe_url}}" style="color:#4a5a6a;text-decoration:underline;">Darse de baja</a>
              &nbsp;·&nbsp; © 2026 SEMZO PRIVÉ
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

SELECT id, name, subject, updated_at FROM email_templates WHERE id = 1;
