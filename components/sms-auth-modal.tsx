"use client"

import { useEffect, useState } from "react"

const SmsAuthModal = () => {
  const [plan, setPlan] = useState<string | null>(null)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [firstName, setFirstName] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const [step, setStep] = useState<string>("register")
  const [confirmationMessage, setConfirmationMessage] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const planParam = params.get("plan")
      if (planParam) {
        setPlan(planParam)
      }
    }
  }, [])

  const handleRegister = async () => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName: "",
          phone,
          plan: plan,
          origin: "checkout",
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.requiresConfirmation) {
          setStep("confirm-email")
          setConfirmationMessage(
            plan
              ? "Revisa tu email para confirmar tu cuenta. Después de confirmar, volverás automáticamente al checkout para completar tu membresía."
              : "Revisa tu email para confirmar tu cuenta. Después de confirmar, podrás acceder a tu dashboard.",
          )
        } else {
          // Handle successful registration without confirmation
        }
      } else {
        // Handle registration failure
      }
    } catch (error) {
      // Handle error
    }
  }

  // ... rest of code here ...

  return <div>{/* Modal content */}</div>
}

export default SmsAuthModal
