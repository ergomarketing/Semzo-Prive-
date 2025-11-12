"use client"

export type EmailLogSimple = {
  id: string
  to: string
  subject: string
  type: string
  status: "sent" | "failed" | "pending"
  timestamp: string
}

class EmailLoggerSimple {
  private logs: EmailLogSimple[] = []
  private static instance: EmailLoggerSimple

  static getInstance(): EmailLoggerSimple {
    if (!EmailLoggerSimple.instance) {
      EmailLoggerSimple.instance = new EmailLoggerSimple()
    }
    return EmailLoggerSimple.instance
  }

  constructor() {
    // Intentar cargar logs del localStorage si estamos en el cliente
    if (typeof window !== "undefined") {
      try {
        const savedLogs = localStorage.getItem("emailLogs")
        if (savedLogs) {
          this.logs = JSON.parse(savedLogs)
        }
      } catch (error) {
        console.error("Error loading email logs:", error)
      }

      // Hacer disponible globalmente para debugging
      window.emailLoggerSimple = this
    }
  }

  private saveLogs(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("emailLogs", JSON.stringify(this.logs))
      } catch (error) {
        console.error("Error saving email logs:", error)
      }
    }
  }

  logEmail(type: string, to: string, subject: string, status: "sent" | "failed" | "pending" = "pending"): string {
    const id = Date.now().toString()
    const log: EmailLogSimple = {
      id,
      to,
      subject,
      type,
      status,
      timestamp: new Date().toISOString(),
    }

    this.logs.push(log)
    this.saveLogs()
    return id
  }

  updateEmailStatus(id: string, status: "sent" | "failed" | "pending"): boolean {
    const logIndex = this.logs.findIndex((log) => log.id === id)
    if (logIndex >= 0) {
      this.logs[logIndex].status = status
      this.saveLogs()
      return true
    }
    return false
  }

  getLogs(): EmailLogSimple[] {
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
    this.saveLogs()
  }
}

// Declarar el tipo para window
declare global {
  interface Window {
    emailLoggerSimple?: EmailLoggerSimple
  }
}

export const emailLoggerSimple = EmailLoggerSimple.getInstance()
