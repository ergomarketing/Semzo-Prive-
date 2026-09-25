"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/app/hooks/useAuth"
import { SELF_REPORTED_OPTIONS, type SelfReported } from "@/lib/attribution"
import { getStoredAttribution } from "@/lib/attribution-client"

const DISMISSED_KEY = "semzo_how_found_dismissed"

/**
 * Pregunta de un toque "¿Como nos conociste?" para el dashboard.
 *
 * Cubre a quienes se registraron sin pasar por /signup (carrito, SMS...) y por
 * tanto no vieron el desplegable. Vive en el dashboard —donde acaban todas las
 * socias— y no en las paginas del checkout, que son un flujo validado.
 *
 * Se auto-gestiona: no renderiza nada salvo que el servidor diga que la cuenta
 * es reciente y aun no ha respondido. Cualquier error la deja oculta.
 */
export default function HowFoundPrompt() {
  const t = useTranslations("howFoundPrompt")
  const tSignup = useTranslations("signup")
  const { user } = useAuth()

  const [step, setStep] = useState<"hidden" | "ask" | "detail" | "thanks">("hidden")
  const [pending, setPending] = useState<SelfReported | null>(null)
  const [detail, setDetail] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user) return
    try {
      if (localStorage.getItem(DISMISSED_KEY) === user.id) return
    } catch {
      // sin localStorage: consultamos igualmente
    }

    let cancelled = false
    fetch("/api/attribution/prompt")
      .then((res) => (res.ok ? res.json() : { eligible: false }))
      .then((data) => {
        if (!cancelled && data?.eligible) setStep("ask")
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [user])

  const rememberDone = () => {
    if (!user) return
    try {
      localStorage.setItem(DISMISSED_KEY, user.id)
    } catch {
      // ignorado
    }
  }

  const dismiss = () => {
    rememberDone()
    setStep("hidden")
  }

  const submit = async (option: SelfReported, detailText: string) => {
    setSending(true)
    try {
      const res = await fetch("/api/attribution/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfReported: option,
          selfReportedDetail: detailText.trim() || null,
          attribution: getStoredAttribution(),
        }),
      })

      if (res.ok) {
        rememberDone()
        setStep("thanks")
        setTimeout(() => setStep("hidden"), 2500)
      } else if (res.status === 409) {
        // ya respondida o cuenta antigua: nada que preguntar
        rememberDone()
        setStep("hidden")
      }
      // otros errores: se queda visible para reintentar o cerrar
    } catch {
      // red: se queda visible
    } finally {
      setSending(false)
    }
  }

  const choose = (option: SelfReported) => {
    if (option === "friend" || option === "other") {
      setPending(option)
      setDetail("")
      setStep("detail")
      return
    }
    void submit(option, "")
  }

  if (step === "hidden") return null

  return (
    <div className="relative mb-6 rounded-lg border border-rose-pastel bg-rose-nude p-4 text-indigo-dark md:p-5">
      {step !== "thanks" && (
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("dismiss")}
          className="absolute right-3 top-3 text-indigo-dark/50 transition hover:text-indigo-dark"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {step === "thanks" ? (
        <p className="font-serif text-lg">{t("thanks")}</p>
      ) : (
        <>
          <p className="pr-6 font-serif text-lg">{t("title")}</p>
          <p className="mb-3 text-sm text-indigo-dark/70">{t("subtitle")}</p>

          {step === "ask" && (
            <div className="flex flex-wrap gap-2">
              {SELF_REPORTED_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={sending}
                  onClick={() => choose(option)}
                  className="rounded-full border border-indigo-dark/30 bg-white px-3 py-1.5 text-xs transition hover:bg-indigo-dark hover:text-white disabled:opacity-50"
                >
                  {tSignup(`howFoundOptions.${option}`)}
                </button>
              ))}
            </div>
          )}

          {step === "detail" && pending && (
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                void submit(pending, detail)
              }}
            >
              <input
                type="text"
                maxLength={200}
                autoFocus
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder={pending === "friend" ? tSignup("howFoundFriendDetail") : tSignup("howFoundOtherDetail")}
                disabled={sending}
                className="h-10 flex-1 rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={sending}
                className="h-10 rounded-md bg-indigo-dark px-5 text-xs uppercase tracking-widest text-white transition hover:bg-indigo-dark/90 disabled:opacity-50"
              >
                {t("send")}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
