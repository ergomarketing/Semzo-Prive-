"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./useAuth"
import { supabase } from "@/lib/supabase"

export interface MembershipState {
  currentPlan: string | null
  pendingPlan: string | null
  membershipStatus: "free" | "essentiel" | "signature" | "prive"
  hasActiveSubscription: boolean
  loading: boolean
}

export function useMembership() {
  const { user } = useAuth()
  const [membershipState, setMembershipState] = useState<MembershipState>({
    currentPlan: null,
    pendingPlan: null,
    membershipStatus: "free",
    hasActiveSubscription: false,
    loading: true,
  })

  const fetchMembershipState = useCallback(async () => {
    if (!user) {
      setMembershipState((prev) => ({ ...prev, loading: false }))
      return
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) return

      const response = await fetch("/api/user/membership-state", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMembershipState({
          currentPlan: data.currentPlan,
          pendingPlan: data.pendingPlan,
          membershipStatus: data.membershipStatus || "free",
          hasActiveSubscription: data.hasActiveSubscription || false,
          loading: false,
        })
      }
    } catch (error) {
      console.error("[useMembership] Error fetching state:", error)
      setMembershipState((prev) => ({ ...prev, loading: false }))
    }
  }, [user])

  const storePendingPlan = useCallback(
    async (planId: string) => {
      if (!user) return false

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) return false

        const response = await fetch("/api/user/store-pending-plan", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planId }),
        })

        if (response.ok) {
          setMembershipState((prev) => ({ ...prev, pendingPlan: planId }))
          return true
        }
      } catch (error) {
        console.error("[useMembership] Error storing pending plan:", error)
      }
      return false
    },
    [user],
  )

  const activateMembership = useCallback(
    async (planId: string) => {
      if (!user) return false

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) return false

        const response = await fetch("/api/user/activate-membership", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planId }),
        })

        if (response.ok) {
          await fetchMembershipState() // Refresh state
          return true
        }
      } catch (error) {
        console.error("[useMembership] Error activating membership:", error)
      }
      return false
    },
    [user, fetchMembershipState],
  )

  useEffect(() => {
    fetchMembershipState()
  }, [fetchMembershipState])

  return {
    ...membershipState,
    storePendingPlan,
    activateMembership,
    refreshState: fetchMembershipState,
  }
}
