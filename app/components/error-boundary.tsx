"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; reset: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error!}
          reset={() => this.setState({ hasError: false, error: undefined })}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-nude/10">
      <div className="text-center p-8 max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-rose-pastel/20 flex items-center justify-center">
          <span className="text-4xl text-indigo-dark">!</span>
        </div>
        <h2 className="font-serif text-2xl text-slate-900 mb-4">Algo salió mal</h2>
        <p className="text-slate-600 mb-6">
          Hemos experimentado un error inesperado. Nuestro equipo ha sido notificado y está trabajando en una solución.
        </p>
        <div className="space-y-4">
          <Button onClick={reset} className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90">
            Intentar de nuevo
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white"
          >
            Recargar página
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-slate-500">Detalles del error</summary>
            <pre className="mt-2 text-xs bg-slate-100 p-2 rounded overflow-auto">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  )
}
