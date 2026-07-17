"use client"

import { NextIntlClientProvider } from "next-intl"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

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

interface IntlProviderProps {
  children: ReactNode
  messages: { es: Record<string, unknown>; en: Record<string, unknown> }
}

export default function IntlProvider({ children, messages }: IntlProviderProps) {
  const [locale, setLocaleState] = useState<Locale>("es")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved === "en" || saved === "es") {
      setLocaleState(saved)
    }
    setMounted(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
    // Update html lang attribute for accessibility and SEO signals
    document.documentElement.lang = newLocale
  }

  // Render with default "es" during SSR to avoid hydration mismatch
  const activeLocale = mounted ? locale : "es"

  return (
    <LocaleContext.Provider value={{ locale: activeLocale, setLocale }}>
      <NextIntlClientProvider
        locale={activeLocale}
        messages={messages[activeLocale] as Record<string, unknown>}
        timeZone="Europe/Madrid"
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
