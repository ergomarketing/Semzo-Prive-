"use client"

import { useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

type PendingAction = () => void | Promise<void>

interface UseRequireAuthReturn {
  showLoginModal: boolean
  setShowLoginModal: (show: boolean) => void
  requireAuth: (action: PendingAction) => Promise<void>
  executePendingAction: () => Promise<void>
  clearPendingAction: () => void
  isAuthenticated: boolean
  checkAuth: () => Promise<boolean>
}

export function useRequireAuth(): UseRequireAuthReturn {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pendingActionRef = useRef<PendingAction | null>(null)

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      const authenticated = !error && !!user
      setIsAuthenticated(authenticated)
      return authenticated
    } catch {
      setIsAuthenticated(false)
      return false
    }
  }, [])

  const requireAuth = useCallback(async (action: PendingAction): Promise<void> => {
    const authenticated = await checkAuth()
    
    if (authenticated) {
      // Usuario autenticado, ejecutar accion directamente
      await action()
    } else {
      // Guardar la accion pendiente y mostrar modal
      pendingActionRef.current = action
      setShowLoginModal(true)
    }
  }, [checkAuth])

  const executePendingAction = useCallback(async (): Promise<void> => {
    if (pendingActionRef.current) {
      const action = pendingActionRef.current
      pendingActionRef.current = null
      setShowLoginModal(false)
      
      // Pequeno delay para asegurar que el modal se cierra
      await new Promise(resolve => setTimeout(resolve, 100))
      await action()
    }
  }, [])

  const clearPendingAction = useCallback((): void => {
    pendingActionRef.current = null
  }, [])

  return {
    showLoginModal,
    setShowLoginModal,
    requireAuth,
    executePendingAction,
    clearPendingAction,
    isAuthenticated,
    checkAuth,
  }
}
