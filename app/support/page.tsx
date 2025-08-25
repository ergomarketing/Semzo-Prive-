"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Phone, Mail, Clock, CheckCircle2 } from "lucide-react"

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    priority: "medium",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          priority: "medium",
        })
      } else {
        const errorData = await response.json()
        console.error("Error al enviar consulta:", errorData)
      }
    } catch (error) {
      console.error("Error de conexión:", error)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3 py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="font-serif text-3xl text-slate-900 mb-4">¡Mensaje enviado!</h2>
              <p className="text-slate-600 mb-6">
                Hemos recibido tu consulta. Nuestro equipo te responderá en un plazo máximo de 24 horas.
              </p>
              <Button
                onClick={() => setIsSubmitted(false)}
                className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
              >
                Enviar otra consulta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3 py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl text-slate-900 mb-4">Centro de Soporte</h1>
          <p className="text-xl text-slate-600">Estamos aquí para ayudarte con cualquier consulta</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Información de contacto */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-indigo-dark" />
                  Teléfono
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-2">+34 911 234 567</p>
                <p className="text-sm text-slate-500">Lunes a Viernes: 9:00 - 18:00</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-indigo-dark" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-2">info@semzoprive.com</p>
                <p className="text-sm text-slate-500">Respuesta en 24 horas</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-indigo-dark" />
                  Chat en vivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">Disponible de 9:00 a 18:00</p>
                <Button className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90">Iniciar chat</Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-indigo-dark" />
                  Horarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Lunes - Viernes:</span>
                    <span>9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sábados:</span>
                    <span>10:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domingos:</span>
                    <span>Cerrado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulario de contacto */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Envíanos un mensaje</CardTitle>
                <p className="text-slate-600">Completa el formulario y te responderemos lo antes posible</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-slate-700 font-medium mb-2 block">
                        Nombre completo *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="María García"
                        className="h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="maria@ejemplo.com"
                        className="h-12"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-slate-700 font-medium mb-2 block">
                      Asunto *
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Consulta sobre mi membresía"
                      className="h-12"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority" className="text-slate-700 font-medium mb-2 block">
                      Prioridad
                    </Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full h-12 px-3 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-slate-700 font-medium mb-2 block">
                      Mensaje *
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe tu consulta o problema..."
                      rows={6}
                      className="resize-none"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 h-12">
                    Enviar mensaje
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="border-0 shadow-lg mt-8">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Preguntas frecuentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">¿Cómo funciona la devolución de bolsos?</h4>
                    <p className="text-slate-600 text-sm">
                      Programas la devolución desde tu dashboard y nosotros recogemos el bolso en tu domicilio sin costo
                      adicional.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">¿Qué pasa si se daña un bolso?</h4>
                    <p className="text-slate-600 text-sm">
                      Todos nuestros bolsos incluyen seguro. El desgaste normal está cubierto, pero daños significativos
                      pueden tener un costo adicional.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">¿Puedo cambiar mi plan de membresía?</h4>
                    <p className="text-slate-600 text-sm">
                      Sí, puedes cambiar tu plan en cualquier momento desde tu dashboard. Los cambios se aplican en el
                      siguiente ciclo de facturación.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
