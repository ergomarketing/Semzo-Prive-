"use client"

import { useLocale } from "@/providers/IntlProvider"

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex items-center gap-1 text-xs font-medium tracking-widest">
      <button
        onClick={() => setLocale("es")}
        aria-label="Cambiar idioma a Español"
        className={`px-1.5 py-0.5 transition-all duration-200 uppercase ${
          locale === "es"
            ? "text-[#1a1a4b] font-semibold"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        ES
      </button>
      <span className="text-slate-300 select-none">|</span>
      <button
        onClick={() => setLocale("en")}
        aria-label="Switch language to English"
        className={`px-1.5 py-0.5 transition-all duration-200 uppercase ${
          locale === "en"
            ? "text-[#1a1a4b] font-semibold"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        EN
      </button>
    </div>
  )
}
