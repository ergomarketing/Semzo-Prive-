"use client"

import { useState } from "react"

const MembershipSignupFlow = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    country: "",
    city: "",
    interests: [],
    marketingConsent: false,
  })
  const [selectedPlan, setSelectedPlan] = useState("")
  const [errors, setErrors] = useState({})

  const nextStep = () => {
    setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          membershipType: selectedPlan,
          preferences: formData,
        }),
      })

      if (response.ok) {
        setCurrentStep(4) // Paso de confirmación
      } else {
        const error = await response.json()
        setErrors({ general: error.message })
      }
    } catch (error) {
      setErrors({ general: "Error al crear la cuenta. Inténtalo de nuevo." })
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2>Información Personal</h2>
            {errors.general && <p style={{ color: "red" }}>{errors.general}</p>}
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
            <input type="text" name="name" placeholder="Nombre" value={formData.name} onChange={handleChange} />
            <input type="tel" name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleChange} />
            <button onClick={nextStep}>Siguiente</button>
          </div>
        )
      case 2:
        return (
          <div>
            <h2>Información Adicional</h2>
            <input type="text" name="country" placeholder="País" value={formData.country} onChange={handleChange} />
            <input type="text" name="city" placeholder="Ciudad" value={formData.city} onChange={handleChange} />
            <label>
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange}
              />
              Acepto recibir información de marketing
            </label>
            <button onClick={prevStep}>Anterior</button>
            <button onClick={nextStep}>Siguiente</button>
          </div>
        )
      case 3:
        return (
          <div>
            <h2>Selecciona tu Plan</h2>
            <button onClick={() => handlePlanSelect("basic")}>Básico</button>
            <button onClick={() => handlePlanSelect("premium")}>Premium</button>
            <button onClick={() => handlePlanSelect("enterprise")}>Enterprise</button>
            <button onClick={prevStep}>Anterior</button>
            <button onClick={handleSubmit}>Finalizar</button>
          </div>
        )
      case 4:
        return (
          <div>
            <h2>¡Registro Exitoso!</h2>
            <p>Gracias por registrarte.</p>
          </div>
        )
      default:
        return null
    }
  }

  return <div>{renderStep()}</div>
}

export default MembershipSignupFlow
