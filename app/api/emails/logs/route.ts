import { type NextRequest, NextResponse } from "next/server"

// Simulamos una base de datos de logs de emails
const emailLogs: any[] = []

export async function GET() {
  try {
    // En una aplicación real, esto vendría de tu base de datos
    const logs = [
      {
        id: "1",
        type: "welcome",
        to: "maria@ejemplo.com",
        subject: "¡Bienvenida a Semzo Privé! 🎉",
        status: "sent",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutos atrás
        details: {
          name: "María García",
          template: "welcome",
          provider: "resend",
        },
      },
      {
        id: "2",
        type: "membership_confirmation",
        to: "ana@ejemplo.com",
        subject: "Confirmación de Membresía Signature",
        status: "sent",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
        details: {
          name: "Ana López",
          membershipType: "signature",
          template: "membership_confirmation",
          provider: "resend",
        },
      },
      {
        id: "3",
        type: "bag_available",
        to: "sofia@ejemplo.com",
        subject: "¡Tu bolso Louis Vuitton está disponible!",
        status: "sent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
        details: {
          name: "Sofía Martín",
          bagName: "Louis Vuitton Pont-Neuf PM",
          template: "bag_available",
          provider: "resend",
        },
      },
      {
        id: "4",
        type: "return_reminder",
        to: "lucia@ejemplo.com",
        subject: "Recordatorio: Devolución de tu bolso",
        status: "failed",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 horas atrás
        details: {
          name: "Lucía Fernández",
          bagName: "Chanel Classic Flap",
          error: "Invalid email address",
          template: "return_reminder",
          provider: "resend",
        },
      },
      {
        id: "5",
        type: "newsletter",
        to: "carmen@ejemplo.com",
        subject: "Nuevas llegadas: Colección Primavera",
        status: "sent",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 día atrás
        details: {
          name: "Carmen Ruiz",
          template: "newsletter",
          provider: "resend",
        },
      },
    ]

    // Agregar logs dinámicos si existen
    const allLogs = [...emailLogs, ...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    return NextResponse.json({
      success: true,
      logs: allLogs,
      total: allLogs.length,
      stats: {
        sent: allLogs.filter((log) => log.status === "sent").length,
        failed: allLogs.filter((log) => log.status === "failed").length,
        pending: allLogs.filter((log) => log.status === "pending").length,
      },
    })
  } catch (error) {
    console.error("❌ Error obteniendo logs de emails:", error)
    return NextResponse.json({ error: "Error obteniendo logs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const logData = await request.json()

    // Agregar el log a nuestra "base de datos" simulada
    emailLogs.unshift({
      id: Date.now().toString(),
      ...logData,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Log registrado",
    })
  } catch (error) {
    console.error("❌ Error registrando log:", error)
    return NextResponse.json({ error: "Error registrando log" }, { status: 500 })
  }
}
