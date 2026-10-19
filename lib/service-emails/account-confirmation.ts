/**
 * Correo nº 1 · Confirmación de cuenta ("Confirma tu registro").
 * Diseño de Erika (2026-10-19). Antes lo mandaba la plantilla de Supabase Auth; ahora sale de Resend.
 *
 * Variables:
 *   {{enlace_confirmacion}}  enlace personal de confirmación (https://semzoprive.com/auth/callback?token_hash=...&type=signup&...)
 * Botón: "Confirmar mi correo" -> {{enlace_confirmacion}}
 * Cambios respecto al HTML original: el enlace del botón usa {{enlace_confirmacion}} en vez de las variables de
 * Supabase, y se quitó "Darse de baja" del pie (es un correo de servicio, no de marketing).
 */
export const ACCOUNT_CONFIRMATION_SUBJECT = "Confirma tu registro · SEMZO PRIVÉ"

export const ACCOUNT_CONFIRMATION_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirma tu registro · SEMZO PRIVÉ</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Great+Vibes&display=swap" rel="stylesheet" />
  <style>
    @media only screen and (max-width: 480px) {
      .responsive-title { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f9f8f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- CONTENEDOR PRINCIPAL -->
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0;background-color:#ffffff;">

        <!-- 1. HEADER · LOGO -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:12px 20px 6px 20px;">
              <img src="https://semzoprive.com/images/logo-semzo-prive.png"
                   alt=""
                   width="200"
                   style="display:block;height:auto;max-width:200px;border:0;" />
            </td>
          </tr>
        </table>

        <!-- 2. IMAGEN HERO -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0 0 0;">
              <img src="https://h0ayghjex33jktep.public.blob.vercel-storage.com/blog-images/bolsos%20de%20lujo%20por%20suscripcion%20en%20madrid.jpeg"
                   alt=""
                   width="600"
                   style="display:block;width:100%;height:auto;border:0;" />
            </td>
          </tr>
        </table>

        <!-- 3. EYEBROW + TITULAR -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 30px 6px 30px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a96e;font-weight:500;">
                Verificación de cuenta
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 30px 8px 30px;">
              <h1 class="responsive-title" style="margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:28px;line-height:1.3;color:#1a1a4b;letter-spacing:-0.3px;">
                ¡Bienvenida a SEMZO PRIVÉ!
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 0 24px 0;">
              <div style="width:40px;height:2px;background-color:#c9a96e;margin:0 auto;"></div>
            </td>
          </tr>
        </table>

        <!-- 4. CUERPO DEL EMAIL -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-size:16px;line-height:1.8;padding:0;">
                    <p style="margin:0 0 20px 0;">Gracias por unirte a nuestra exclusiva comunidad de lujo.</p>
                    <p style="margin:0 0 20px 0;">Para completar tu registro y comenzar a disfrutar de nuestro catálogo, confirma tu correo electrónico:</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- 5. CTA PRINCIPAL -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:10px 20px 24px 20px;">
              <a href="{{enlace_confirmacion}}" style="display:inline-block;background-color:#1a1a4b;color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;padding:18px 56px;letter-spacing:2px;text-transform:uppercase;border:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:220px;text-align:center;box-shadow:0 4px 12px rgba(26,26,75,0.2);">
                Confirmar mi correo
              </a>
            </td>
          </tr>
        </table>

        <!-- 6. BLOQUE ROSA · AVISO LEGAL Y DE VALIDEZ -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#fff0f3;">
          <tr>
            <td align="center" style="padding:24px 30px;">
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#3a3a5c;text-align:center;">
                El acceso completo al servicio queda condicionado a la verificación de identidad conforme a los <a href="https://semzoprive.com/legal/terms" style="color:#1a1a4b;font-weight:600;text-decoration:underline;">Términos y Condiciones</a> de Semzo Privé.
              </p>

              <div style="width:30px;height:1px;background-color:#c9a96e;margin:0 auto 16px auto;"></div>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:360px;border-collapse:collapse;margin:0 auto;">
                <tr>
                  <td style="font-size:14px;color:#3a3a5c;line-height:1.6;text-align:left;padding-bottom:8px;">
                    <strong style="color:#1a1a4b;">Información importante:</strong>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#3a3a5c;line-height:1.6;text-align:left;padding-bottom:6px;">
                    • Este enlace es válido por <strong>1 hora</strong>.
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#3a3a5c;line-height:1.6;text-align:left;">
                    • Si no creaste una cuenta en Semzo Privé, ignora este correo.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- 7. BLOQUE FINAL EDITORIAL (FIJO) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;padding-top:30px;">
          <tr>
            <td align="center" style="padding:0 20px 30px 20px;">

              <p style="margin:0 0 0 0;font-family:'Great Vibes',cursive;font-size:42px;color:#1a1a4b;text-align:center;letter-spacing:1px;line-height:1.2;">
                Erika
              </p>
              <p style="margin:4px 0 0 0;font-size:14px;color:#7a7a94;letter-spacing:0.5px;text-align:center;">
                Fundadora de SEMZO PRIVÉ
              </p>

              <div style="width:30px;height:1px;background-color:#c9a96e;margin:20px auto 18px auto;"></div>

              <p style="margin:0 0 0 0;font-family:'Playfair Display',Georgia,serif;font-size:18px;line-height:1.5;font-style:italic;color:#1a1a4b;text-align:center;letter-spacing:-0.2px;">
                "El verdadero lujo no consiste en tener más.<br />Consiste en elegir mejor."
              </p>

              <div style="width:40px;height:1px;background-color:#c9a96e;margin:24px auto 20px auto;"></div>

              <p style="margin:0 0 2px 0;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:600;color:#1a1a4b;letter-spacing:0.5px;text-align:center;">
                SEMZO PRIVÉ
              </p>
              <p style="margin:0 0 0 0;font-family:'Playfair Display',Georgia,serif;font-size:14px;font-style:italic;color:#7a7a94;text-align:center;letter-spacing:0.3px;">
                Tu puerta de acceso al armario de tus sueños
              </p>

              <div style="height:18px;"></div>

              <!-- REDES SOCIALES -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://instagram.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/instagram/1e1b4b" width="24" height="24" alt="Instagram" style="display:block;border:0;" />
                    </a>
                  </td>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://pinterest.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/pinterest/1e1b4b" width="24" height="24" alt="Pinterest" style="display:block;border:0;" />
                    </a>
                  </td>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://tiktok.com/@semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/tiktok/1e1b4b" width="24" height="24" alt="TikTok" style="display:block;border:0;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:10px;color:#7a7a94;letter-spacing:0.5px;padding-top:4px;">Instagram</td>
                  <td align="center" style="font-size:10px;color:#7a7a94;letter-spacing:0.5px;padding-top:4px;">Pinterest</td>
                  <td align="center" style="font-size:10px;color:#7a7a94;letter-spacing:0.5px;padding-top:4px;">TikTok</td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- 8. COPYRIGHT -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 14px 20px;font-size:9px;color:#d0d0d0;letter-spacing:0.3px;">
              <span>© 2026 SEMZO PRIVÉ</span>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
