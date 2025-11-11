"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Clock, User, Send } from "lucide-react"

interface ChatConversation {
  id: string
  customerName: string
  customerEmail: string
  status: "active" | "waiting" | "closed"
  lastMessage: string
  timestamp: Date
  unreadCount: number
}

interface Message {
  id: string
  text: string
  sender: "customer" | "admin"
  timestamp: Date
}

export default function ChatAdminPage() {
  const [conversations] = useState<ChatConversation[]>([
    {
      id: "1",
      customerName: "María García",
      customerEmail: "maria@email.com",
      status: "active",
      lastMessage: "¿Cuándo estará disponible el Chanel Classic?",
      timestamp: new Date(),
      unreadCount: 2,
    },
    {
      id: "2",
      customerName: "Ana López",
      customerEmail: "ana@email.com",
      status: "waiting",
      lastMessage: "Gracias por la información",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      unreadCount: 0,
    },
  ])

  const [selectedConversation, setSelectedConversation] = useState<string | null>("1")
  const [messages] = useState<Message[]>([
    {
      id: "1",
      text: "Hola, estoy interesada en la membresía Signature",
      sender: "customer",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: "2",
      text: "¡Hola María! Me alegra saber de tu interés. La membresía Signature incluye 1 bolso por mes con envío express gratuito.",
      sender: "admin",
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
    },
    {
      id: "3",
      text: "¿Cuándo estará disponible el Chanel Classic?",
      sender: "customer",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
    },
  ])

  const [newMessage, setNewMessage] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "waiting":
        return "bg-yellow-100 text-yellow-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activa"
      case "waiting":
        return "Esperando"
      case "closed":
        return "Cerrada"
      default:
        return "Desconocido"
    }
  }

  return (
    <div className="min-h-screen bg-rose-nude/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-indigo-dark mb-2">Chat en Vivo</h1>
          <p className="text-gray-600">Gestiona las conversaciones con tus clientes en tiempo real</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Lista de Conversaciones */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors ${
                      selectedConversation === conversation.id ? "bg-indigo-50 border-l-4 border-l-indigo-dark" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-sm">{conversation.customerName}</span>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{conversation.lastMessage}</p>

                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(conversation.status)}>
                        {getStatusText(conversation.status)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {conversation.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {conversations.find((c) => c.id === selectedConversation)?.customerName}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {conversations.find((c) => c.id === selectedConversation)?.customerEmail}
                      </p>
                    </div>
                    <Badge
                      className={getStatusColor(conversations.find((c) => c.id === selectedConversation)?.status || "")}
                    >
                      {getStatusText(conversations.find((c) => c.id === selectedConversation)?.status || "")}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0 flex flex-col h-[450px]">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender === "admin" ? "bg-indigo-dark text-white" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender === "admin" ? "text-indigo-100" : "text-gray-500"
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-dark"
                        rows={2}
                      />
                      <Button
                        onClick={() => {
                          if (newMessage.trim()) {
                            setNewMessage("")
                          }
                        }}
                        className="bg-indigo-dark hover:bg-indigo-dark/90"
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecciona una conversación para comenzar</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversaciones Activas</p>
                  <p className="text-2xl font-bold text-indigo-dark">3</p>
                </div>
                <MessageCircle className="h-8 w-8 text-indigo-dark" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Respuesta Promedio</p>
                  <p className="text-2xl font-bold text-indigo-dark">2m</p>
                </div>
                <Clock className="h-8 w-8 text-indigo-dark" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfacción</p>
                  <p className="text-2xl font-bold text-indigo-dark">98%</p>
                </div>
                <div className="text-2xl">😊</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversiones</p>
                  <p className="text-2xl font-bold text-indigo-dark">67%</p>
                </div>
                <div className="text-2xl">💎</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
