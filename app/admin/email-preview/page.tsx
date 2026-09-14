"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, Send, Loader2, CheckCircle2, XCircle } from "lucide-react"

interface LifecycleTemplate {
  sequence_key: string
  step_number: number
  name: string
  subject: string
}

interface CodeEmail {
  key: string
  label: string
}

type SendResult = { status: "sending" | "success" | "error"; message?: string }

export default function EmailPreviewPage() {
  const [to, setTo] = useState("")
  const [lifecycleEmails, setLifecycleEmails] = useState<LifecycleTemplate[]>([])
  const [codeEmails, setCodeEmails] = useState<CodeEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<Record<string, SendResult>>({})

  useEffect(() => {
    fetch("/api/admin/send-test-email")
      .then((res) => res.json())
      .then((data) => {
        setLifecycleEmails(data.lifecycleEmails || [])
        setCodeEmails(data.codeEmails || [])
      })
      .catch((err) => console.error("[v0] Error cargando plantillas:", err))
      .finally(() => setLoading(false))
  }, [])

  const sendTest = async (resultKey: string, payload: Record<string, unknown>) => {
    if (!to) {
      setResults((prev) => ({ ...prev, [resultKey]: { status: "error", message: "Indica un email de destino" } }))
      return
    }
    setResults((prev) => ({ ...prev, [resultKey]: { status: "sending" } }))
    try {
      const res = await fetch("/api/admin/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al enviar")
      setResults((prev) => ({ ...prev, [resultKey]: { status: "success" } }))
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [resultKey]: { status: "error", message: err instanceof Error ? err.message : "Error desconocido" },
      }))
    }
  }

  const groupedLifecycle = lifecycleEmails.reduce<Record<string, LifecycleTemplate[]>>((acc, tpl) => {
    acc[tpl.sequence_key] = acc[tpl.sequence_key] || []
    acc[tpl.sequence_key].push(tpl)
    return acc
  }, {})

  const renderResultBadge = (resultKey: string) => {
    const result = results[resultKey]
    if (!result) return null
    if (result.status === "sending") return <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
    if (result.status === "success")
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <CheckCircle2 className="h-3 w-3" /> Enviado
        </Badge>
      )
    return (
      <Badge className="bg-red-100 text-red-800 gap-1" title={result.message}>
        <XCircle className="h-3 w-3" /> Error
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-slate-900">Prueba manual de emails</h1>
        <p className="text-slate-600">
          Dispara cualquier email del sistema con datos de ejemplo hacia una dirección de prueba, para verificarlo
          visualmente en tu bandeja de entrada.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <label htmlFor="test-email-to" className="text-sm font-medium text-slate-700 mb-2 block">
            Email de destino
          </label>
          <Input
            id="test-email-to"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600">Cargando plantillas...</p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Emails transaccionales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {codeEmails.map((email) => {
                const resultKey = `code:${email.key}`
                return (
                  <div
                    key={email.key}
                    className="flex items-center justify-between border border-slate-200 rounded-lg p-4"
                  >
                    <p className="font-medium text-slate-900">{email.label}</p>
                    <div className="flex items-center gap-3">
                      {renderResultBadge(resultKey)}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={results[resultKey]?.status === "sending"}
                        onClick={() => sendTest(resultKey, { kind: "code", codeKey: email.key })}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar prueba
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {Object.entries(groupedLifecycle).map(([sequenceKey, steps]) => (
            <Card key={sequenceKey}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    {sequenceKey}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps
                  .sort((a, b) => a.step_number - b.step_number)
                  .map((step) => {
                    const resultKey = `lifecycle:${sequenceKey}:${step.step_number}`
                    return (
                      <div
                        key={resultKey}
                        className="flex items-center justify-between border border-slate-200 rounded-lg p-4"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            Paso {step.step_number} · {step.name}
                          </p>
                          <p className="text-sm text-slate-600">{step.subject}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {renderResultBadge(resultKey)}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={results[resultKey]?.status === "sending"}
                            onClick={() =>
                              sendTest(resultKey, {
                                kind: "lifecycle",
                                sequenceKey,
                                stepNumber: step.step_number,
                              })
                            }
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Enviar prueba
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}
