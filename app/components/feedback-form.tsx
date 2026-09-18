"use client"

import { useState, type FormEvent } from "react"

const SCORES = Array.from({ length: 11 }, (_, i) => i) // 0..10

export default function FeedbackForm() {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (rating === null) {
      setErrorMessage("Elige una puntuación del 0 al 10 antes de enviar.")
      return
    }

    setErrorMessage("")
    setStatus("submitting")

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, consentToPublish: consent }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo enviar tu opinión")
      }

      setStatus("done")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo enviar tu opinión")
      setStatus("idle")
    }
  }

  if (status === "done") {
    return (
      <div className="max-w-lg w-full text-center">
        <p className="text-xs uppercase tracking-widest text-indigo-dark mb-3 font-medium">Gracias</p>
        <h1 className="font-serif text-3xl md:text-4xl font-light text-slate-900 mb-4 leading-tight">
          Tu opinión ha sido recibida
        </h1>
        <p className="text-slate-600 leading-relaxed">
          Erika y el equipo de SEMZO PRIVÉ la leerán personalmente. Gracias por ayudarnos a mejorar tu experiencia.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg w-full">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-widest text-indigo-dark mb-3 font-medium">Tu opinión cuenta</p>
        <h1 className="font-serif text-3xl md:text-4xl font-light text-slate-900 leading-tight">
          ¿Cómo fue tu experiencia?
        </h1>
        <p className="text-slate-600 mt-4 leading-relaxed">
          ¿Qué probabilidad hay de que nos recomiendes a una amiga? Solo te llevará un momento.
        </p>
      </div>

      <fieldset className="mb-6">
        <legend className="sr-only">Puntuación del 0 al 10</legend>
        <div className="grid grid-cols-11 gap-1.5">
          {SCORES.map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setRating(score)}
              aria-pressed={rating === score}
              className={`aspect-square rounded-md text-sm font-medium border transition-colors ${
                rating === score
                  ? "bg-indigo-dark text-white border-indigo-dark"
                  : "bg-white text-slate-700 border-slate-200 hover:border-rose-pastel"
              }`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Nada probable</span>
          <span>Muy probable</span>
        </div>
      </fieldset>

      <div className="mb-6">
        <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-2">
          ¿Algo que quieras contarnos? (opcional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full rounded-md border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-pastel"
          placeholder="Cuéntanos qué te encantó o qué podríamos mejorar"
        />
      </div>

      <label className="flex items-start gap-3 mb-6 text-sm text-slate-600 leading-relaxed">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-dark focus:ring-rose-pastel"
        />
        Autorizo que SEMZO PRIVÉ muestre mi opinión (con mi nombre e inicial) en la web.
      </label>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600 mb-4">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-indigo-dark text-white py-3 rounded-md text-sm uppercase tracking-widest font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "submitting" ? "Enviando..." : "Dejar mi opinión"}
      </button>
    </form>
  )
}
