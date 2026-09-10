-- Fase 3 — Diseño final de marca para checkout_abandoned, paso 1 (inmediato).
-- Reemplaza el fragmento provisional insertado antes por el HTML completo
-- proporcionado por el cliente (documento con su propio head/logo/tipografías).
-- Ya aplicado en la base de datos via Supabase MCP. Este script queda como
-- referencia versionada en el repo.
--
-- El resto de pasos/secuencias (checkout_abandoned paso 2, renewal_reminder,
-- card_expiring, winback, pause_reactivation, back_in_stock, nps,
-- membership_onboarding) siguen pendientes de recibir su diseño final y se
-- irán actualizando con scripts equivalentes, uno por email.

update lifecycle_email_templates
set
  is_full_document = true,
  subject = 'Tu selección sigue aquí',
  body_html = $HTML$<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SEMZO PRIVÉ · Tu selección sigue aquí</title>
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

  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0;background-color:#ffffff;">

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

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0 0 0;">
              <img src="https://h0ayghjex33jktep.public.blob.vercel-storage.com/blog-images/1767796848856-bolsos_dior_alquiler_por_dias.jpeg"
                   alt=""
                   width="600"
                   style="display:block;width:100%;height:auto;border:0;" />
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 30px 8px 30px;">
              <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:28px;line-height:1.3;color:#1a1a4b;letter-spacing:-0.3px;">
                Tu selección sigue aquí
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 0 20px 0;">
              <div style="width:40px;height:2px;background-color:#c9a96e;margin:0 auto;"></div>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-size:16px;line-height:1.8;padding:0;">

                    <p style="margin:0 0 20px 0;">Hola {{name}},</p>
                    <p style="margin:0 0 20px 0;">Hace un momento estuviste a punto de entrar.</p>
                    <p style="margin:0 0 20px 0;">No sé qué pasó — quizás te interrumpieron, quizás surgió algo. Pero tu selección sigue aquí, reservada para ti.</p>
                    <p style="margin:0 0 20px 0;">Completar tu membresía SEMZO PRIVÉ toma menos de tres minutos. Y lo que viene después — ese primer bolso llegando a tu puerta, la sensación de abrirlo — eso no tiene prisa, pero sí tiene fecha.</p>
                    <p style="margin:0 0 20px 0;">Las plazas de nuestra colección son limitadas. No por marketing. Porque cada pieza que entra al club pasa por un proceso de selección y autenticación que nos toma tiempo y cuidado.</p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:20px 20px 20px 20px;">
              <div style="width:60px;height:1px;background-color:#c9a96e;margin:0 auto 24px auto;"></div>
              <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.35;font-weight:500;color:#1a1a4b;letter-spacing:-0.4px;text-align:center;">
                Tu lugar sigue disponible.<br />Por ahora.
              </p>
              <div style="width:60px;height:1px;background-color:#c9a96e;margin:24px auto 0 auto;"></div>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 10px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-size:17px;line-height:1.7;padding:0;text-align:center;font-family:'Playfair Display',Georgia,serif;font-style:italic;">
                    <p style="margin:0;">Retoma donde lo dejaste.<br />Solo te quedan unos minutos.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:10px 20px 12px 20px;">
              <a href="{{resume_url}}" style="display:inline-block;background-color:#1a1a4b;color:#ffffff;font-size:16px;font-weight:500;text-decoration:none;padding:18px 64px;letter-spacing:2px;text-transform:uppercase;border:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:220px;text-align:center;box-shadow:0 4px 12px rgba(26,26,75,0.2);">
                Retomar mi membresía
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 20px 36px 20px;">
              <a href="https://semzoprive.com/catalog" style="display:inline-block;color:#1a1a4b;font-size:14px;font-family:'Playfair Display',Georgia,serif;font-style:italic;text-decoration:underline;text-underline-offset:3px;padding:10px 0;">
                O explorar la colección primero
              </a>
            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;padding-top:10px;">
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

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 14px 20px;font-size:9px;color:#d0d0d0;letter-spacing:0.3px;">
              <span>© 2026 SEMZO PRIVÉ · </span><a href="#" style="color:#d0d0d0;text-decoration:none;">Darse de baja</a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>$HTML$,
  updated_at = now()
where sequence_key = 'checkout_abandoned' and step_number = 1;
