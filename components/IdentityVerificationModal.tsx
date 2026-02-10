"use client"
import { X } from "lucide-react"

interface IdentityVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  verificationUrl: string | null
  isCreating: boolean
  error: string | null
  onOpenVerification: () => void
}

export function IdentityVerificationModal({
  isOpen,
  onClose,
  verificationUrl,
  isCreating,
  error,
  onOpenVerification,
}: IdentityVerificationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif">Verificar identidad</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

        {isCreating && <p className="text-center py-4">Preparando verificación...</p>}

        {verificationUrl && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Haz clic en el botón para abrir la ventana de verificación de Stripe Identity.
            </p>
            <button
              onClick={onOpenVerification}
              className="w-full bg-[#1a1a4b] text-white py-3 rounded-md hover:bg-[#1a1a4b]/90 transition-colors font-medium"
            >
              Iniciar verificación
            </button>
            <p className="text-xs text-gray-500 text-center">Necesitarás tu documento de identidad y una selfie</p>
          </div>
        )}
      </div>
    </div>
  )
}
