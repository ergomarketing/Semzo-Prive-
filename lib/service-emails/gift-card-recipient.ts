/**
 * Correo · "Tienes un regalo" (Gift Card recibida). Diseño de Erika (2026-10-21).
 *
 * Variables: {{saludo_nombre}} (" Rosa" o vacío) · {{nombre}} destinatario · {{nombre_comprador}} quien regala · {{importe}} · {{codigo_gift_card}} ·
 * {{url_canje}} (botón "Canjear mi regalo"). Dos bloques se montan en código y se OCULTAN si no hay dato:
 *   {{bloque_mensaje}}   mensaje personal del comprador (vacío si no escribió ninguno)
 *   {{linea_caducidad}}  "Válida hasta el …" (vacío si la tarjeta no tiene fecha)
 * Cambios respecto al HTML original: sin "Darse de baja" (correo de servicio a un tercero que no se ha dado de
 * alta en nada) y el mensaje personal pasa a ser opcional de verdad.
 */
export const GIFT_CARD_RECIPIENT_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SEMZO PRIVÉ · Tienes un regalo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Great+Vibes&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f9f8f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- CONTENEDOR PRINCIPAL -->
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0;background-color:#ffffff;">

        <!-- ========================================== -->
        <!-- 1. LOGO                                    -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 20px 20px 20px;">
              <img src="https://semzoprive.com/images/logo-semzo-prive.png"
                   alt="SEMZO PRIVÉ"
                   width="180"
                   style="display:block;height:auto;max-width:180px;border:0;" />
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 2. IMAGEN HERO (La caja de regalo)         -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding:0;">
              <img src="https://h0ayghjex33jktep.public.blob.vercel-storage.com/blog-images/giftcard%20sp.png" 
                   alt="Tarjeta de Regalo SEMZO PRIVÉ" 
                   width="600" 
                   style="display:block;width:100%;height:auto;border:0;" />
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 3. EYEBROW + TITULAR                       -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 30px 6px 30px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a96e;font-weight:500;">
                Un detalle exclusivo
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 30px 8px 30px;">
              <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:28px;line-height:1.3;color:#1a1a4b;letter-spacing:-0.3px;">
                Alguien quiere que disfrutes del lujo
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
        <!-- 4. CUERPO DEL EMAIL                        -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-family:'Playfair Display',Georgia,serif;font-size:17px;line-height:1.7;padding:0;">

                    <p style="margin:0 0 20px 0;">Hola{{saludo_nombre}},</p>
                    <p style="margin:0 0 20px 0;"><strong>{{nombre_comprador}}</strong> ha pensado en ti. Quiere que descubras lo que significa vivir el lujo sin ataduras, y te ha reservado un regalo muy especial.</p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 5. TARJETA DE REGALO (BLOQUE DE DATOS)     -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:10px 20px 24px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;background-color:#faf8f8;border:1px solid #e8dcc8;border-radius:8px;">
                <tr>
                  <td style="padding:32px 24px; text-align:center;">
                    
                    <p style="margin:0 0 8px 0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;text-transform:uppercase;color:#7a7a94;letter-spacing:2px;">
                      Tarjeta de Regalo SEMZO PRIVÉ
                    </p>
                    
                    <p style="margin:0 0 24px 0;font-family:'Playfair Display',Georgia,serif;font-size:42px;font-weight:600;color:#1a1a4b;">
                      {{importe}}€
                    </p>

                    <!-- CÓDIGO DE LA TARJETA -->
                    <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;border-collapse:collapse;">
                      <tr>
                        <td style="background-color:#ffffff;border:1px dashed #c9a96e;padding:12px 24px;border-radius:4px;">
                          <p style="margin:0;font-family:monospace;font-size:18px;font-weight:600;color:#1a1a4b;letter-spacing:1px;">
                            {{codigo_gift_card}}
                          </p>
                        </td>
                      </tr>
                    </table>

                    {{bloque_mensaje}}

                    

                    {{linea_caducidad}}

                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 6. CIERRE DE TEXTO                         -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-family:'Playfair Display',Georgia,serif;font-size:17px;line-height:1.7;padding:0;">
                    <p style="margin:0 0 20px 0;">Úsala para acceder a la colección, reservar ese bolso que llevas tiempo mirando o como parte del pago de tu membresía.</p>
                    <p style="margin:0 0 20px 0;text-align:center;font-style:italic;">Porque el lujo es aún más especial cuando se comparte.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 7. CTA PRINCIPAL                           -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:10px 20px 16px 20px;">
              <!-- URL DE CANJE -->
              <a href="{{url_canje}}" style="display:inline-block;background-color:#1a1a4b;color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;padding:18px 56px;letter-spacing:2px;text-transform:uppercase;border:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:220px;text-align:center;box-shadow:0 4px 12px rgba(26,26,75,0.2);">
                Canjear mi regalo
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 20px 36px 20px;">
              <a href="https://semzoprive.com/catalog" style="display:inline-block;color:#1a1a4b;font-size:14px;font-family:'Playfair Display',Georgia,serif;font-style:italic;text-decoration:underline;text-underline-offset:3px;padding:10px 0;">
                Explorar la colección primero
              </a>
            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 8. BLOQUE FINAL EDITORIAL (FIJO)           -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;padding-top:10px;">
          <tr>
            <td align="center" style="padding:0 20px 30px 20px;">

              <p style="margin:0 0 0 0;font-family:'Great Vibes',cursive;font-size:42px;color:#1a1a4b;text-align:center;letter-spacing:1px;line-height:1.2;">
                Erika
              </p>
              <p style="margin:4px 0 0 0;font-size:14px;color:#7a7a94;font-family:-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0.5px;text-align:center;">
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
                  <td align="center" style="font-size:10px;color:#7a7a94;font-family:-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0.5px;padding-top:4px;">Instagram</td>
                  <td align="center" style="font-size:10px;color:#7a7a94;font-family:-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0.5px;padding-top:4px;">Pinterest</td>
                  <td align="center" style="font-size:10px;color:#7a7a94;font-family:-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0.5px;padding-top:4px;">TikTok</td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- ========================================== -->
        <!-- 9. COPYRIGHT                               -->
        <!-- ========================================== -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 14px 20px;font-size:9px;color:#d0d0d0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:0.3px;">
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
