"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function TestEmailsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const testReservationEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading("reservation")

    const formData = new FormData(e.currentTarget)
    const data = {
      userEmail: formData.get("userEmail"),
      userName: formData.get("userName"),
      bagName: formData.get("bagName"),
      reservationDate: formData.get("reservationDate"),
    }

    try {
      const response = await fetch("/api/emails/sohomail/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({ title: "Email de reserva enviado correctamente" })
      } else {
        const error = await response.text()
        toast({ title: "Error", description: error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al enviar email", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  const testPaymentEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading("payment")

    const formData = new FormData(e.currentTarget)
    const data = {
      userEmail: formData.get("userEmail"),
      userName: formData.get("userName"),
      amount: formData.get("amount"),
      paymentId: formData.get("paymentId"),
    }

    try {
      const response = await fetch("/api/emails/sohomail/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({ title: "Email de pago enviado correctamente" })
      } else {
        const error = await response.text()
        toast({ title: "Error", description: error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al enviar email", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  const testContactEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading("contact")

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({ title: "Email de contacto enviado correctamente" })
      } else {
        const error = await response.text()
        toast({ title: "Error", description: error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al enviar email", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  const testNewsletterEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading("newsletter")

    const formData = new FormData(e.currentTarget)
    const data = {
      email: formData.get("email"),
      subject: formData.get("subject"),
      content: formData.get("content"),
    }

    try {
      const response = await fetch("/api/emails/sohomail/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({ title: "Newsletter enviado correctamente" })
      } else {
        const error = await response.text()
        toast({ title: "Error", description: error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al enviar email", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Prueba de Emails SohoMail</h1>
        <p className="text-muted-foreground mt-2">Prueba todos los tipos de emails desde aquí</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Reservation Email */}
        <Card>
          <CardHeader>
            <CardTitle>Notificación de Reserva</CardTitle>
            <CardDescription>Prueba el email de confirmación de reserva de bolso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={testReservationEmail} className="space-y-4">
              <div>
                <Label htmlFor="userEmail">Email del Usuario</Label>
                <Input id="userEmail" name="userEmail" type="email" defaultValue="test@example.com" required />
              </div>
              <div>
                <Label htmlFor="userName">Nombre del Usuario</Label>
                <Input id="userName" name="userName" defaultValue="Test User" required />
              </div>
              <div>
                <Label htmlFor="bagName">Nombre del Bolso</Label>
                <Input id="bagName" name="bagName" defaultValue="Chanel Classic Flap" required />
              </div>
              <div>
                <Label htmlFor="reservationDate">Fecha de Reserva</Label>
                <Input id="reservationDate" name="reservationDate" type="date" required />
              </div>
              <Button type="submit" disabled={loading === "reservation"} className="w-full">
                {loading === "reservation" ? "Enviando..." : "Enviar Email de Reserva"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Payment Email */}
        <Card>
          <CardHeader>
            <CardTitle>Confirmación de Pago</CardTitle>
            <CardDescription>Prueba el email de confirmación de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={testPaymentEmail} className="space-y-4">
              <div>
                <Label htmlFor="userEmail">Email del Usuario</Label>
                <Input id="userEmail" name="userEmail" type="email" defaultValue="test@example.com" required />
              </div>
              <div>
                <Label htmlFor="userName">Nombre del Usuario</Label>
                <Input id="userName" name="userName" defaultValue="Test User" required />
              </div>
              <div>
                <Label htmlFor="amount">Cantidad</Label>
                <Input id="amount" name="amount" defaultValue="150" required />
              </div>
              <div>
                <Label htmlFor="paymentId">ID de Pago</Label>
                <Input id="paymentId" name="paymentId" defaultValue="pay_123456" required />
              </div>
              <Button type="submit" disabled={loading === "payment"} className="w-full">
                {loading === "payment" ? "Enviando..." : "Enviar Email de Pago"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Contact Email */}
        <Card>
          <CardHeader>
            <CardTitle>Formulario de Contacto</CardTitle>
            <CardDescription>Prueba el email del formulario de contacto</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={testContactEmail} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" defaultValue="Test User" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue="test@example.com" required />
              </div>
              <div>
                <Label htmlFor="subject">Asunto</Label>
                <Input id="subject" name="subject" defaultValue="Consulta de prueba" required />
              </div>
              <div>
                <Label htmlFor="message">Mensaje</Label>
                <Textarea id="message" name="message" defaultValue="Este es un mensaje de prueba" required />
              </div>
              <Button type="submit" disabled={loading === "contact"} className="w-full">
                {loading === "contact" ? "Enviando..." : "Enviar Email de Contacto"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Newsletter Email */}
        <Card>
          <CardHeader>
            <CardTitle>Newsletter</CardTitle>
            <CardDescription>Prueba el envío de newsletter</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={testNewsletterEmail} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Destinatario</Label>
                <Input id="email" name="email" type="email" defaultValue="test@example.com" required />
              </div>
              <div>
                <Label htmlFor="subject">Asunto</Label>
                <Input id="subject" name="subject" defaultValue="Newsletter Semzo Privé" required />
              </div>
              <div>
                <Label htmlFor="content">Contenido</Label>
                <Textarea id="content" name="content" defaultValue="Contenido del newsletter de prueba" required />
              </div>
              <Button type="submit" disabled={loading === "newsletter"} className="w-full">
                {loading === "newsletter" ? "Enviando..." : "Enviar Newsletter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
