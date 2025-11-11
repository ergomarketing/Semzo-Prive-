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

  const faqCategories = [
    {
      title: "Membresías y Suscripciones",
      icon: Users,
      description: "Información sobre planes de membresía y suscripciones a bolsos de lujo",
      articles: 10, // Updated article count from 9 to 10
      faqs: [
        {
          question: "¿Qué es la membresía de SEMZO PRIVE?",
          answer:
            "SEMZO es un servicio de suscripción de membresía para bolsos de lujo. La membresía desbloquea el acceso a la colección SEMZO, con bolsos que se adaptan a cada estilo, ocasión y personalidad; entregado directamente en tu puerta. Los miembros pueden experimentar un nuevo bolso cada mes, y comprar los estilos que desean conservar para siempre. Es una forma más inteligente y circular de disfrutar de la variedad y la novedad.",
        },
        {
          question: "¿Puedo recomendar a mi amigo a SEMZO PRIVE?",
          answer:
            "¡Sí tu puedes! Con el programa RECOMENDAR A MI AMIGA de SEMZO PRIVE, puedes recomendar a tantos amigos como desees. Cuando tu amigo se registre con tu código de referencia (envía un correo electrónico a nuestro equipo de membresía), recibirá 50€ en crédito SEMZO PRIVE por su primer cargo de cualquier membresía de tiempo completo. Una vez que completen el plazo mínimo de 60 días, también ganarás 50€ en crédito SEMZO PRIVE. Los créditos solo son válidos para membresías.",
        },
        {
          question: "¿Cómo funciona la membresía de bolsos de lujo Semzo Privé?",
          answer:
            "Nuestra membresía te permite acceder a una colección exclusiva de bolsos de diseñador por una tarifa mensual. Puedes reservar 1 bolso por mes, disfrutarlo durante todo el mes y cambiarlo por otro modelo al siguiente ciclo.",
        },
        {
          question: "¿Puedo cambiar mi plan de membresía en cualquier momento?",
          answer:
            "Sí, puedes actualizar o cambiar tu plan de membresía desde tu dashboard personal. Los cambios se aplicarán en tu próximo ciclo de facturación y tendrás acceso inmediato a los beneficios del nuevo plan.",
        },
      ],
    },
    {
      title: "Proceso de Reserva",
      icon: Package,
      description: "Todo sobre cómo reservar y gestionar tus bolsos de diseñador",
      articles: 6,
      faqs: [
        {
          question: "¿Cómo reservo un bolso de diseñador?",
          answer:
            "Desde tu dashboard, navega por nuestra colección de bolsos de marcas como Chanel, Louis Vuitton, Hermès y más. Selecciona el bolso que desees, elige las fechas y confirma tu reserva. El bolso será preparado y enviado en 24-48 horas.",
        },
        {
          question: "¿Cuántos bolsos puedo tener al mismo tiempo?",
          answer:
            "Todas nuestras membresías incluyen un bolso de lujo a la vez. El precio de tu membresía mensual se ajusta automáticamente según el valor del bolso que selecciones, permitiéndote acceder a piezas exclusivas de Chanel, Hermès, Louis Vuitton y otras marcas de lujo con total flexibilidad.",
        },
      ],
    },
    {
      title: "Entrega y Devoluciones",
      icon: Truck,
      description: "Información sobre envíos, entregas y proceso de devolución",
      articles: 7, // Updated article count from 5 to 7
      faqs: [
        {
          question: "¿Cómo funciona la entrega de bolsos a domicilio?",
          answer:
            "Realizamos entregas gratuitas en 24-48 horas en Marbella y Málaga. Para otras ciudades de España, el tiempo de entrega es de 2-3 días laborables. Todos los envíos incluyen seguro completo y seguimiento en tiempo real.",
        },
        {
          question: "¿Cómo devuelvo un bolso cuando termine de usarlo?",
          answer:
            "La devolución se realiza automáticamente al finalizar tu mes de membresía. Debes devolver el bolso con todos los elementos originales (dust bag, tarjetas de autenticidad, etc.) usando la etiqueta de envío prepagada que recibiste junto al bolso. Una vez enviado, recibirás confirmación de recepción en 24-48 horas.",
        },
        {
          question: "¿Cómo sé que mi bolso ha sido devuelto con éxito?",
          answer:
            "Una vez que hemos recibido el bolso en nuestro almacén, se somete a una inspección física y luego se procesa para su devolución. Recibirás un correo electrónico para confirmar que tu pedido ha sido devuelto. Si tu pedido ha sido devuelto con daños que no estaban allí cuando se te envió el bolso, te enviaremos un correo electrónico por separado con respecto al daño y describiendo los próximos pasos.",
        },
        {
          question: "¿Qué pasa si no puedo devolver mis bolsos dentro del tiempo especificado?",
          answer:
            "Como miembro de Semzo Privé, es tu responsabilidad asegurarte de poder devolver el pedido de bolsos dentro del plazo asignado de un mes. Independientemente de dónde te encuentres, tus requisitos de membresía aún se aplican y a los miembros que no puedan devolver sus bolsos a tiempo se les pueden cobrar cargos por demora o se les puede pedir que compren el bolso en lugar de devolverlo. Si no devuelves un bolso en la fecha requerida, serás responsable de un recargo por retraso de 15€ por día hábil hasta que se devuelva el bolso. Cualquier bolso que no se devuelva después de 4 semanas se considerará no devuelto, y el miembro será responsable de pagar el valor total de venta del bolso.",
        },
      ],
    },
    {
      title: "Condición y autenticidad",
      icon: Shield,
      description: "Información sobre la autenticidad y estado de nuestros bolsos de lujo",
      articles: 2,
      faqs: [
        {
          question: "¿Cómo sé que los bolsos de su colección son auténticos?",
          answer:
            "Todas nuestras bolsas se obtienen directamente de marcas, vendedores autorizados o proveedores externos de segunda mano de buena reputación. Todos nuestros artículos han pasado por un riguroso proceso de autenticación de varias capas, realizado de forma independiente por nuestro equipo de expertos internos, así como por autenticadores de terceros, antes de estar disponibles. Podemos proporcionar un Certificado de Autenticidad de Entrupy para ciertos estilos de la colección a pedido. Si compra un artículo y un autenticador verificado demuestra que no es auténtico, SEMZO PRIVE le proporcionará un reembolso completo al devolver la bolsa. Si por cualquier motivo, no está satisfecho con una bolsa que ha comprado en SEMZO PRIVE, puede devolverla de acuerdo con nuestra política de devoluciones. Comuníquese con nuestro equipo de membresía si tiene alguna pregunta sobre una bolsa que haya pedido con su membresía SEMZO PRIVE o comprado en SEMZO PRIVE. Tenga en cuenta que SEMZO PRIVE no es un vendedor autorizado de las marcas que enumera en su sitio web. Las marcas cuyos artículos se ofrecen no son responsables de ningún producto comprado a SEMZO PRIVE y no garantizan la autenticidad de los artículos.",
        },
        {
          question: "¿En qué estado están las bolsas?",
          answer:
            "Todos nuestros bolsos son nuevos o estilos usados en perfectas condiciones. Nuestros artículos vintage han vivido una vida anterior, por lo que, por supuesto, pueden mostrar algunos signos de edad. Algunos también pueden haber requerido reparaciones (que siempre se realizan con los más altos estándares), pero todo esto es parte del encanto de la bolsa. Si recibimos una bolsa que tiene un desgaste normal, tomaremos una decisión sobre si queremos mantenerla en la colección para que nuestros miembros la disfruten. Cuando las bolsas necesitan un poco de cariño, se reparan para prolongar su vida útil. Cuando ya no son una buena opción para la colección, encontramos un dueño amoroso para que continúen empoderando y elevando.",
        },
      ],
    },
    {
      title: "Facturación y Pagos",
      icon: CreditCard,
      description: "Gestión de pagos, facturación y métodos de pago aceptados",
      articles: 4,
      faqs: [
        {
          question: "¿Qué métodos de pago aceptan para la membresía?",
          answer:
            "Aceptamos todas las tarjetas de crédito principales (Visa, Mastercard, American Express), PayPal y transferencia bancaria. Los pagos se procesan de forma segura y automática cada mes.",
        },
        {
          question: "¿Puedo pausar mi membresía temporalmente?",
          answer:
            "Sí, puedes pausar tu membresía hasta por 3 meses al año sin penalizaciones. Durante la pausa no se realizarán cobros y podrás reactivarla cuando desees desde tu cuenta.",
        },
      ],
    },
    {
      title: "Cuidado y Mantenimiento",
      icon: Shield,
      description: "Consejos para el cuidado de bolsos de lujo y política de daños",
      articles: 7,
      faqs: [
        {
          question: "¿Qué ocurre si el bolso se daña o mancha?",
          answer:
            "Tu suscripción incluye un seguro básico de uso cotidiano. En caso de un accidente menor (ej. una mancha ligera o un roce), nuestro equipo se encarga de la limpieza profesional. En situaciones más graves: Se evalúa el daño. Si es reparable, nos encargamos del proceso. Si es irreparable, aplicamos una política justa basada en el valor del bolso y tu plan de suscripción. ✨ Queremos que disfrutes con libertad, no con miedo.",
        },
        {
          question: "¿Cómo debo cuidar los bolsos de cuero durante mi uso?",
          answer:
            "Incluimos una guía de cuidado con cada bolso. Recomendamos evitar la exposición directa al sol, usar productos de limpieza específicos para cuero de lujo, y guardar el bolso en su dust bag cuando no lo uses.",
        },
      ],
    },
    {
      title: "Cuenta y Perfil",
      icon: Settings,
      description: "Gestión de tu cuenta, perfil personal y configuraciones",
      articles: 3,
      faqs: [
        {
          question: "¿Cómo actualizo mi información de perfil y dirección?",
          answer:
            "Accede a tu dashboard y ve a la sección 'Mi Perfil'. Allí puedes actualizar tu información personal, direcciones de entrega, métodos de pago y preferencias de comunicación en tiempo real.",
        },
        {
          question: "¿Puedo tener múltiples direcciones de entrega?",
          answer:
            "Sí, puedes agregar hasta 3 direcciones de entrega diferentes (casa, oficina, etc.) y seleccionar cuál usar para cada reserva. Esto te da flexibilidad total para recibir tus bolsos donde más te convenga.",
        },
      ],
    },
  ]

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
                    <Button type="submit" className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90">
                      Enviar mensaje
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
