import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

const ADMIN_EMAIL = "mailbox@semzoprive.com"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reservationId, userName, userEmail, bagName, bagImage, startDate, endDate, membershipType } = body

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.titan.email",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Email to admin
    await transporter.sendMail({
      from: `"Semzo Privé" <${process.env.SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `🎒 Nueva Reserva: ${bagName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1a2c4e 0%, #2d4a7c 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 30px; }
            .alert-badge { background: #fce4ec; color: #c62828; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin-bottom: 20px; }
            .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #eee; }
            .info-label { color: #666; width: 140px; font-weight: 500; }
            .info-value { color: #1a2c4e; font-weight: 600; }
            .action-btn { display: inline-block; background: #1a2c4e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SEMZO PRIVÉ</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Panel de Administración</p>
            </div>
            <div class="content">
              <span class="alert-badge">⚡ NUEVA RESERVA</span>
              
              <h2 style="color: #1a2c4e; margin: 20px 0;">Acción requerida: Preparar envío</h2>
              
              <div class="info-row">
                <span class="info-label">Bolso:</span>
                <span class="info-value">${bagName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cliente:</span>
                <span class="info-value">${userName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${userEmail}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Membresía:</span>
                <span class="info-value">${membershipType?.toUpperCase() || "N/A"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha inicio:</span>
                <span class="info-value">${new Date(startDate).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha fin:</span>
                <span class="info-value">${new Date(endDate).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <div class="info-row" style="border: none;">
                <span class="info-label">ID Reserva:</span>
                <span class="info-value" style="font-family: monospace; font-size: 12px;">${reservationId}</span>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.semzoprive.com"}/admin/reservations" class="action-btn">
                Ver en Panel de Admin →
              </a>
            </div>
            <div class="footer">
              <p>Este es un email automático del sistema de reservas de Semzo Privé.</p>
              <p>No responder a este email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    // Email to user
    await transporter.sendMail({
      from: `"Semzo Privé" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `✨ Reserva Confirmada: ${bagName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1a2c4e 0%, #2d4a7c 100%); color: white; padding: 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; }
            .content { padding: 40px; }
            .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
            .bag-card { background: #fafafa; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .bag-name { font-size: 20px; font-weight: 600; color: #1a2c4e; margin-bottom: 5px; }
            .dates { color: #666; margin-top: 15px; }
            .date-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .footer { background: #1a2c4e; color: white; padding: 30px; text-align: center; }
            .footer a { color: #f8bbd9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SEMZO PRIVÉ</h1>
            </div>
            <div class="content">
              <div class="success-icon">🎉</div>
              <h2 style="text-align: center; color: #1a2c4e; margin-bottom: 30px;">¡Tu reserva está confirmada!</h2>
              
              <p style="color: #666; text-align: center;">Hola ${userName},</p>
              <p style="color: #666; text-align: center;">Tu bolso de lujo está siendo preparado para ti.</p>
              
              <div class="bag-card">
                <div class="bag-name">${bagName}</div>
                <div class="dates">
                  <div class="date-row">
                    <span>📅 Desde:</span>
                    <strong>${new Date(startDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</strong>
                  </div>
                  <div class="date-row">
                    <span>📅 Hasta:</span>
                    <strong>${new Date(endDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</strong>
                  </div>
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Próximos pasos:</strong><br>
                1. Prepararemos tu bolso con el mayor cuidado<br>
                2. Te enviaremos el tracking cuando salga<br>
                3. ¡Disfruta de tu bolso de lujo!
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px;"><strong>SEMZO PRIVÉ</strong></p>
              <p style="margin: 0; font-size: 13px; opacity: 0.8;">¿Preguntas? <a href="mailto:info@semzoprive.com">info@semzoprive.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending reservation notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
