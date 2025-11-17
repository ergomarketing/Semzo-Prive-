# Guía para Actualizar Template de Reset Password en Supabase

## Ubicación
Edita este template en: **Supabase Dashboard → Authentication → Email Templates → Reset Password**

## CSS a Agregar (dentro de `<style>`)

Agrega este CSS dentro de tu bloque `<style>` existente (después de la línea que dice `text-align: center;`):

\`\`\`css
.button { 
    display: inline-block; 
    background: #E8B4CB; 
    color: #2B2D6B; 
    padding: 15px 35px; 
    text-decoration: none; 
    border-radius: 25px; 
    font-weight: bold; 
    margin: 30px 0; 
    font-size: 16px;
    letter-spacing: 0.5px;
}
\`\`\`

## HTML a Reemplazar

**ANTES (lo que tienes ahora - líneas 96-97):**
\`\`\`html
<p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
\`\`\`

**DESPUÉS (lo que debes poner):**
\`\`\`html
<p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>

<div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" class="button">
        Restablecer mi contraseña
    </a>
</div>

<p style="margin-top: 30px; font-size: 14px; color: #999;">
    Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura.
</p>
\`\`\`

## Código Completo del Template

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer Contraseña - Semzo Privé</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: #2B2D6B; 
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: normal; 
            letter-spacing: 2px; 
        }
        .header p { 
            margin: 8px 0 0 0; 
            opacity: 0.9; 
            font-size: 14px; 
            letter-spacing: 1px;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .content h2 { 
            color: #2B2D6B; 
            margin: 0 0 20px 0; 
            font-size: 24px; 
            font-weight: normal;
        }
        .content p { 
            margin-bottom: 20px; 
            font-size: 16px; 
            line-height: 1.6; 
            color: #666;
            text-align: center;
        }
        /* Agregado: Estilo del botón rosado */
        .button { 
            display: inline-block; 
            background: #E8B4CB; 
            color: #2B2D6B; 
            padding: 15px 35px; 
            text-decoration: none; 
            border-radius: 25px; 
            font-weight: bold; 
            margin: 30px 0; 
            font-size: 16px;
            letter-spacing: 0.5px;
        }
        .footer { 
            background: #2B2D6B; 
            color: white; 
            padding: 30px; 
            text-align: center; 
            font-size: 14px; 
        }
        .footer p {
            margin: 5px 0;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Semzo Privé</h1>
            <p>Acceso Exclusivo al Lujo</p>
        </div>
        
        <div class="content">
            <h2>Restablecer tu contraseña</h2>
            
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Semzo Privé.</p>
            
            <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
            
            <!-- Agregado: Botón rosado con el enlace de confirmación -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" class="button">
                    Restablecer mi contraseña
                </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #999;">
                Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura.
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 Semzo Privé. Todos los derechos reservados.</p>
            <p>Soporte: <a href="mailto:contacto@semzoprive.com" style="color: white; text-decoration: underline;">contacto@semzoprive.com</a></p>
        </div>
    </div>
</body>
</html>
\`\`\`

## Notas Importantes

1. **Variable de Supabase**: La variable `{{ .ConfirmationURL }}` es específica de Supabase y contiene el enlace único para restablecer la contraseña.

2. **Colores de la paleta Semzo Privé**:
   - Azul oscuro (header/footer): `#2B2D6B`
   - Rosa (botón): `#E8B4CB`
   - Gris texto: `#666` y `#999`

3. **Estructura del botón**:
   - Fondo rosado (#E8B4CB)
   - Texto azul oscuro (#2B2D6B)
   - Bordes redondeados (25px)
   - Padding generoso (15px 35px)
   - Sin subrayado (text-decoration: none)

4. **Dónde aplicar**: Copia este código completo en el editor de templates de Supabase Dashboard.
