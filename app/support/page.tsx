"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MessageCircle,
  Mail,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  Package,
  Truck,
  CreditCard,
  Shield,
  Settings,
} from "lucide-react"
import { faqCategoriesData, type FaqCategoryData } from "./faq-data"

// Mapa de nombres de icono a componentes lucide. Asi el archivo de datos
// (faq-data.ts) se mantiene puro JSON sin imports de iconos, y aqui hacemos
// el binding al icono visual.
const iconMap = {
  Users,
  Package,
  Truck,
  Shield,
  CreditCard,
  Settings,
} as const

// Reconstruimos el array que ya usaba la UI: data + icon component.
// No se modifica la logica de render, solo de donde vienen los datos.
type FaqCategoryWithIcon = Omit<FaqCategoryData, "iconName"> & {
  icon: (typeof iconMap)[keyof typeof iconMap]
}
const faqCategoriesWithIcons: FaqCategoryWithIcon[] = faqCategoriesData.map((cat) => ({
  ...cat,
  icon: iconMap[cat.iconName],
}))

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showContactForm, setShowContactForm] = useState(false)
  const [showChatForm, setShowChatForm] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    priority: "medium",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Datos importados desde ./faq-data (compartidos con layout.tsx para
  // generar el JSON-LD FAQPage schema). Single source of truth.
  const faqCategories = faqCategoriesWithIcons

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

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
        const errorData = await response.json().catch(() => ({}))
        setSubmitError(errorData?.error || "No pudimos enviar tu mensaje. Inténtalo de nuevo.")
      }
    } catch (error) {
      setSubmitError("Error de conexión. Comprueba tu internet e inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryTitle) ? prev.filter((title) => title !== categoryTitle) : [...prev, categoryTitle],
    )
  }

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter(
      (category) =>
        searchQuery === "" ||
        category.faqs.length > 0 ||
        category.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )

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
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3">
      <div className="relative bg-gradient-to-r from-indigo-dark to-slate-800 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 max-w-4xl text-center">
          <h1 className="font-serif text-5xl mb-6">¿Tienes preguntas? Nosotros tenemos respuestas</h1>
          <p className="text-xl mb-8 text-white/90">
            Encuentra respuestas rápidas a tus consultas sobre membresías, bolsos de lujo y más
          </p>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar en preguntas frecuentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-white/95 border-0 focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-16">
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-slate-900 mb-4">Obtener más información</h2>
            <p className="text-slate-600 text-lg">Explora nuestras categorías de ayuda más populares</p>
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCategories.map((category) => {
              const IconComponent = category.icon
              const isExpanded = expandedCategories.includes(category.title)
              return (
                <Card key={category.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader
                    className="pb-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleCategory(category.title)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-lg bg-indigo-dark/10 flex items-center justify-center mr-4 group-hover:bg-indigo-dark/20 transition-colors">
                          <IconComponent className="h-6 w-6 text-indigo-dark" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-900 hover:text-indigo-dark transition-colors">
                            {category.title}
                          </CardTitle>
                          <p className="text-sm text-slate-500">{category.articles} artículos</p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mt-3">{category.description}</p>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {category.faqs.map((faq, faqIndex) => (
                          <div key={faqIndex} className="border-l-4 border-indigo-dark/20 pl-4 py-2">
                            <h4 className="font-semibold text-slate-900 mb-2">{faq.question}</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl text-slate-900 mb-4">Obtener asistencia</h2>
            <p className="text-slate-600">¿No encuentras lo que buscas? Nuestro equipo está aquí para ayudarte</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact Form Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setShowContactForm(!showContactForm)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="h-6 w-6 text-indigo-dark mr-3" />
                    <div>
                      <CardTitle className="text-lg">Contáctanos</CardTitle>
                      <p className="text-sm text-slate-500">
                        ¿Tienes alguna pregunta que no está cubierta en nuestras preguntas frecuentes o deseas
                        comunicarte con nuestro equipo de membresía? No dudes en enviar un correo electrónico a nuestro
                        equipo de membresía.
                      </p>
                    </div>
                  </div>
                  {showContactForm ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>

              {showContactForm && (
                <CardContent className="pt-0">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-slate-700 font-medium mb-2 block">
                          Nombre completo *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="María García"
                          className="h-10"
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
                          className="h-10"
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
                        className="h-10"
                        required
                      />
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
                        rows={4}
                        className="resize-none"
                        required
                      />
                    </div>
                    {submitError && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {submitError}
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 disabled:opacity-60"
                    >
                      {isSubmitting ? "Enviando..." : "Enviar mensaje"}
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>

            {/* Chat Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setShowChatForm(!showChatForm)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageCircle className="h-6 w-6 text-indigo-dark mr-3" />
                    <div>
                      <CardTitle className="text-lg">Chatea con nosotros</CardTitle>
                      <p className="text-sm text-slate-500">
                        ¿No encuentras respuestas a tu pregunta? ¡Chatea con nosotros!
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Lunes - Viernes 09:00 AM - 06:00 PM GMT+1</p>
                    </div>
                  </div>
                  {showChatForm ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>

              {showChatForm && (
                <CardContent className="pt-0">
                  <div className="text-center py-8">
                    <MessageCircle className="h-16 w-16 text-indigo-dark/20 mx-auto mb-4" />
                    <h3 className="font-semibold text-slate-900 mb-2">Chat en vivo próximamente</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Estamos trabajando en implementar nuestro sistema de chat en vivo. Mientras tanto, puedes
                      contactarnos por email.
                    </p>
                    <Button
                      onClick={() => {
                        setShowChatForm(false)
                        setShowContactForm(true)
                      }}
                      className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
                    >
                      Enviar email
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
