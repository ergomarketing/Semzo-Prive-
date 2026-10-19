/**
 * Correo · "Has cancelado tu membresía" (confirmación de baja).
 * Diseño de Erika (2026-10-19). Se envía al cancelar desde la web (memberships/cancel) o desde Stripe.
 *
 * Variables:
 *   {{nombre}}            primer nombre de la socia
 *   {{fecha_fin_acceso}}  hasta cuándo conserva el acceso, p. ej. "31 de diciembre de 2026"
 *   {{tier}}              Petite, L'Essentiel, Signature o Privé
 *   {{enlace_volver}}     botón "Volver a SEMZO PRIVÉ" -> /membresias (con UTM de winback para medir)
 * Cambio respecto al HTML original: el enlace del botón es la variable {{enlace_volver}} (mismo destino).
 */
export const MEMBERSHIP_CANCELLED_SUBJECT = "Has cancelado tu membresía"

export const MEMBERSHIP_CANCELLED_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SEMZO PRIVÉ · Membresía cancelada</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Great+Vibes&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f9f8f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- CONTENEDOR PRINCIPAL -->
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0;background-color:#ffffff;">

        <!-- ========================================== -->
        <!-- IMAGEN HERO (Bolso Fendi Rojo)            -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding:0;">
              <img src="https://h0ayghjex33jktep.public.blob.vercel-storage.com/publicidad/Cancelacion%20de%20membresia_.jpg" 
                   alt="Bolso de lujo SEMZO PRIVÉ" 
                   width="600" 
                   style="display:block;width:100%;height:auto;border:0;" />
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- CUERPO DEL EMAIL (Alineado a la izquierda)-->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding: 45px 40px 30px 40px;">
              
              <!-- TITULAR -->
              <h1 style="margin:0 0 20px 0;font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:32px;line-height:1.2;color:#1a1a4b;letter-spacing:-0.3px;">
                Tu membresía ha quedado cancelada
              </h1>
              
              <!-- LÍNEA DORADA -->
              <div style="width:45px;height:2px;background-color:#c9a96e;margin:0 0 30px 0;"></div>

              <!-- TEXTO -->
              <p style="margin:0 0 24px 0;color:#111;font-size:16px;line-height:1.6;">Hola {{nombre}},</p>
              <p style="margin:0 0 24px 0;color:#111;font-size:16px;line-height:1.6;">Tu membresía SEMZO PRIVÉ ha quedado cancelada.</p>
              <p style="margin:0 0 24px 0;color:#111;font-size:16px;line-height:1.6;">Seguirás teniendo acceso hasta el <strong>{{fecha_fin_acceso}}</strong> — hasta entonces puedes usar todos los beneficios de tu plan <strong>{{tier}}</strong> con normalidad.</p>
              
              <p style="margin:0 0 24px 0;color:#111;font-size:16px;line-height:1.6;">Si tienes un bolso contigo ahora mismo, coordinaremos la recogida antes de esa fecha. Te escribiremos con los detalles.</p>
              
              <p style="margin:0 0 24px 0;color:#111;font-size:16px;line-height:1.6;">Antes de que te vayas, una pregunta:</p>
              
              <p style="margin:0 0 24px 0;color:#111;font-size:16px;line-height:1.6;">¿Hubo algo que no funcionó como esperabas? Un bolso que no encontraste, una entrega que tardó demasiado, algo que no encajó.</p>
              
              <p style="margin:0 0 24px 0;color:#111;font-size:16px;line-height:1.6;">Me importa saberlo — no para convencerte de nada, sino porque cada respuesta mejora el club para las que vienen después.</p>
              
              <p style="margin:0 0 36px 0;color:#111;font-size:16px;line-height:1.6;">Responde a este email si quieres contármelo. Llega directamente a mí.</p>

              <!-- BOTÓN CTA -->
              <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td align="center" style="background-color:#1a1a4b;">
                    <a href="{{enlace_volver}}" style="display:inline-block;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;padding:16px 40px;letter-spacing:1.5px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      Volver a SEMZO PRIVÉ
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin:36px 0 0 0;color:#111;font-size:16px;line-height:1.6;">Con cariño,<br>Erika<br><span style="font-size:14px;color:#7a7a94;">Fundadora de SEMZO PRIVÉ</span></p>

            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- FOOTER OFICIAL                            -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;padding-top:20px;">
          <tr>
            <td align="center" style="padding:0 40px 30px 40px;">
              
              <!-- Línea divisoria -->
              <div style="width:100%;height:1px;background-color:#f0ebed;margin:0 0 24px 0;"></div>

              <p style="margin:0 0 4px 0;font-family:'Playfair Display',Georgia,serif;font-size:18px;font-weight:600;color:#1a1a4b;letter-spacing:0.5px;">
                SEMZO PRIVÉ
              </p>
              <p style="margin:0 0 20px 0;font-family:'Playfair Display',Georgia,serif;font-size:13px;font-style:italic;color:#7a7a94;letter-spacing:0.3px;">
                Tu puerta de acceso al armario de tus sueños
              </p>

              <!-- REDES SOCIALES -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 8px;">
                    <a href="https://instagram.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:8px;">
                      <img src="https://cdn.simpleicons.org/instagram/1e1b4b" width="20" height="20" alt="Instagram" style="display:block;border:0;" />
                    </a>
                  </td>
                  <td align="center" style="padding:0 8px;">
                    <a href="https://pinterest.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:8px;">
                      <img src="https://cdn.simpleicons.org/pinterest/1e1b4b" width="20" height="20" alt="Pinterest" style="display:block;border:0;" />
                    </a>
                  </td>
                  <td align="center" style="padding:0 8px;">
                    <a href="https://tiktok.com/@semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:8px;">
                      <img src="https://cdn.simpleicons.org/tiktok/1e1b4b" width="20" height="20" alt="TikTok" style="display:block;border:0;" />
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Copyright -->
              <p style="margin:24px 0 0 0;font-size:11px;color:#b8b2b8;letter-spacing:0.3px;">
                © 2026 SEMZO PRIVÉ · Todos los derechos reservados.
              </p>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
