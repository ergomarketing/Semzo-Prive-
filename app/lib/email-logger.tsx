"use client"

interface EmailLog {
  id: string
  type: string
  to: string
  subject: string
  status: "sent" | "failed" | "pending"
  timestamp: string
  details?: any
}

class EmailLogger {
  private static instance: EmailLogger
  private logs: EmailLog[] = []

  static getInstance(): EmailLogger {
    if (!EmailLogger.instance) {
      EmailLogger.instance = new EmailLogger()
    }
    return EmailLogger.instance
  }

  constructor() {
    // Cargar logs del localStorage si existen
    if (typeof window !== "undefined") {
      const savedLogs = localStorage.getItem("emailLogs")
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs)
      }
    }
  }

  logEmail(type: string, to: string, subject: string, status: "sent" | "failed" | "pending", details?: any) {
    const log: EmailLog = {
      id: Date.now().toString(),
      type,
      to,
      subject,
      status,
      timestamp: new Date().toISOString(),
      details,
    }

    this.logs.unshift(log) // Agregar al inicio
    this.saveLogs()

    console.log(`📧 Email ${status}: ${type} to ${to}`)
  }

  updateEmailStatus(id: string, status: "sent" | "failed") {
    const log = this.logs.find((l) => l.id === id)
    if (log) {
      log.status = status
      this.saveLogs()
    }
  }

  getLogs(): EmailLog[] {
    return this.logs
  }

  getLogsByType(type: string): EmailLog[] {
    return this.logs.filter((log) => log.type === type)
  }

  getLogsByStatus(status: "sent" | "failed" | "pending"): EmailLog[] {
    return this.logs.filter((log) => log.status === status)
  }

  clearLogs() {
    this.logs = []
    this.saveLogs()
  }

  private saveLogs() {
    if (typeof window !== "undefined") {
      localStorage.setItem("emailLogs", JSON.stringify(this.logs))
    }
  }
}

export const emailLogger = EmailLogger.getInstance()
export type { EmailLog }
