"use client"

import { NextIntlClientProvider } from "next-intl"
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"

export type Locale = "es" | "en"

const STORAGE_KEY = "semzo_locale"

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "es",
  setLocale: () => {},
})

export function useLocale() {
  return useContext(LocaleContext)
}

type Messages = Record<string, unknown>

interface IntlProviderProps {
  children: ReactNode
  /**
   * Mensajes del idioma por defecto ("es"), importados en el layout (Server
   * Component) y renderizados en SSR/SSG. El inglés NO viaja en el bundle
   * inicial: se carga bajo demanda con import() (chunk aparte) solo si la
   * visitante elige EN o ya lo tenía guardado. Antes se enviaban es.json +
   * en.json juntos (~123 KB) al cliente, penalizando el TBT.
   */
  defaultMessages: Messages
}

export default function IntlProvider({ children, defaultMessages }: IntlProviderProps) {
  const [locale, setLocaleState] = useState<Locale>("es")
  const [messages, setMessages] = useState<Messages>(defaultMessages)

  // Cache en memoria por idioma para no re-descargar en-json al alternar.
  const cacheRef = useRef<Partial<Record<Locale, Messages>>>({ es: defaultMessages })

  const applyLocale = useCallback(async (next: Locale) => {
    if (next === "en" && !cacheRef.current.en) {
      try {
        const mod = await import("@/messages/en.json")
        cacheRef.current.en = (mod.default ?? mod) as Messages
      } catch {
        // Si falla la carga del inglés, nos quedamos en español.
        return
      }
    }

    const nextMessages = cacheRef.current[next]
    if (!nextMessages) return

    setMessages(nextMessages)
    setLocaleState(next)
    if (typeof document !== "undefined") {
      document.documentElement.lang = next
    }
  }, [])

  // Al montar: aplicar la preferencia guardada si es distinta del default.
  useEffect(() => {
    let saved: Locale | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    } catch {
      saved = null
    }
    if (saved === "en") {
      void applyLocale("en")
    }
  }, [applyLocale])

  const setLocale = useCallback(
    (next: Locale) => {
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // localStorage puede fallar en modo privado; el cambio de idioma
        // sigue funcionando para esta sesión.
      }
      void applyLocale(next)
    },
    [applyLocale],
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Madrid">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
