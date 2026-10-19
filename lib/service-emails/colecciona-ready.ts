/**
 * Correo · "Ya puedes finalizar tu compra" (Colecciona: el crédito acumulado ya cubre el precio).
 * Diseño de Erika (2026-10-19). Se envía una vez, cuando el crédito alcanza el precio; la compra solo se cierra
 * cuando la socia confirma y paga desde su panel.
 *
 * Variables:
 *   {{nombre}}        primer nombre de la socia
 *   {{nombre_bolso}}  modelo del bolso (p. ej. "Club 2 Mini")
 *   {{marca_bolso}}   marca (p. ej. "Furla")
 *   {{imagen_bolso}}  foto del bolso (URL)
 *   {{url_panel}}     botón "Finalizar la compra" -> /dashboard
 * Cambio respecto al HTML original: se quitó "Darse de baja" del pie (es un correo de servicio, no de marketing).
 */
export const COLECCIONA_READY_SUBJECT = "Ya puedes finalizar tu compra"

export const COLECCIONA_READY_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SEMZO PRIVÉ · Finaliza tu compra</title>
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

        <!-- ========================================== -->
        <!-- 1. HEADER · LOGO                          -->
        <!-- ========================================== -->
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

        <!-- ========================================== -->
        <!-- 2. IMAGEN HERO                            -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0 0 0;">
              <img src="https://h0ayghjex33jktep.public.blob.vercel-storage.com/publicidad/membresia%20en%20pausa.jpeg"
                   alt=""
                   width="600"
                   style="display:block;width:100%;height:auto;border:0;" />
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 3. EYEBROW + TITULAR                      -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 30px 6px 30px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a96e;font-weight:500;">
                Compra lista para finalizar
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 30px 8px 30px;">
              <h1 class="responsive-title" style="margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:28px;line-height:1.3;color:#1a1a4b;letter-spacing:-0.3px;">
                Ya puedes finalizar tu compra
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 0 24px 0;">
              <div style="width:40px;height:2px;background-color:#c9a96e;margin:0 auto;"></div>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 4. CUERPO DEL EMAIL                       -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-size:16px;line-height:1.8;padding:0;">
                    <p style="margin:0 0 24px 0;">Hola {{nombre}},</p>
                    <p style="margin:0 0 24px 0;">Tu crédito acumulado ya cubre el precio de <strong>{{nombre_bolso}}</strong>.</p>
                    <p style="margin:0 0 24px 0;">Confirma la compra desde tu panel para completarla. Hasta entonces, el bolso seguirá reservado y no pasará a tu colección.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 5. TARJETA DEL PRODUCTO (Estilo Editorial)-->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:10px 20px 20px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;background-color:#faf8f8;border-radius:8px;">
                <tr>
                  <td style="padding:20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                      <tr>
                        <!-- Imagen del bolso -->
                        <td style="width:80px;vertical-align:middle;">
                          <img src="{{imagen_bolso}}" alt="{{nombre_bolso}}" width="80" style="display:block;width:80px;height:auto;border-radius:4px;" />
                        </td>
                        <!-- Detalles del bolso -->
                        <td style="padding-left:20px;vertical-align:middle;text-align:left;">
                          <p style="margin:0 0 4px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7a7a94;font-weight:500;">
                            {{marca_bolso}}
                          </p>
                          <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:600;color:#1a1a4b;">
                            {{nombre_bolso}}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 6. CTA PRINCIPAL                          -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:10px 20px 36px 20px;">
              <a href="{{url_panel}}" style="display:inline-block;background-color:#1a1a4b;color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;padding:18px 56px;letter-spacing:2px;text-transform:uppercase;border:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:220px;text-align:center;box-shadow:0 4px 12px rgba(26,26,75,0.2);">
                Finalizar la compra
              </a>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 7. BLOQUE FINAL EDITORIAL (FIJO)          -->
        <!-- ========================================== -->
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

        <!-- ========================================== -->
        <!-- 8. COPYRIGHT                              -->
        <!-- ========================================== -->
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
