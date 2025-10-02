"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  User,
  MapPin,
  CreditCard,
  Shield,
  Clock,
  Package,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info,
} from "lucide-react"

interface BagDetails {
  id: string
  name: string
  brand: string
  images: string[]
  price: string
  retailPrice: string
  membershipType: "essentiel" | "signature" | "prive"
  color: string
  material: string
  dimensions: string
  condition: string
}

interface ReservationDates {
  startDate: Date
  endDate: Date
  totalDays: number
}

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  membershipType: "essentiel" | "signature" | "prive"
  membershipId?: string
}

interface ShippingInfo {
  address: string
  city: string
  postalCode: string
  province: string
  country: string
  specialInstructions?: string
  preferredDeliveryTime: "morning" | "afternoon" | "evening" | "any"
  isBusinessAddress: boolean
}

interface PaymentInfo {
  method: "card" | "paypal" | "bank_transfer"
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardName?: string
  saveCard: boolean
}

interface ReservationPreferences {
  occasionType: string[]
  careInstructions: boolean
  insuranceLevel: "basic" | "premium" | "luxury"
  returnMethod: "pickup" | "shipping"
  specialRequests?: string
}

interface CompleteReservationFormProps {
  selectedBag: BagDetails
  reservationDates: ReservationDates
  onSubmit?: (reservationData: any) => void
  onCancel?: () => void
  existingCustomer?: CustomerInfo
}

export default function CompleteReservationForm({
  selectedBag,
  reservationDates,
  onSubmit,
  onCancel,
  existingCustomer,
}: CompleteReservationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(
    existingCustomer || {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthDate: "",
      membershipType: "essentiel",
    },
  )
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: "",
    city: "",
    postalCode: "",
    province: "",
    country: "España",
    preferredDeliveryTime: "any",
    isBusinessAddress: false,
  })
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: "card",
    saveCard: false,
  })
  const [preferences, setPreferences] = useState<ReservationPreferences>({
    occasionType: [],
    careInstructions: true,
    insuranceLevel: "basic",
    returnMethod: "shipping",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const totalSteps = 5

  // Calculate pricing
  const calculatePricing = () => {
    const basePrice = Number.parseFloat(selectedBag.price.replace("€/mes", ""))
    const dailyRate = basePrice / 30
    const subtotal = dailyRate * reservationDates.totalDays

    const insuranceFee =
      preferences.insuranceLevel === "premium"
        ? subtotal * 0.1
        : preferences.insuranceLevel === "luxury"
          ? subtotal * 0.15
          : subtotal * 0.05

    const deliveryFee =
      customerInfo.membershipType === "prive" ? 0 : customerInfo.membershipType === "signature" ? 0 : 15

    const total = subtotal + insuranceFee + deliveryFee

    return {
      dailyRate: dailyRate.toFixed(2),
      subtotal: subtotal.toFixed(2),
      insuranceFee: insuranceFee.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
    }
  }

  const pricing = calculatePricing()

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1: // Customer Info
        if (!customerInfo.firstName.trim()) newErrors.firstName = "El nombre es obligatorio"
        if (!customerInfo.lastName.trim()) newErrors.lastName = "Los apellidos son obligatorios"
        if (!customerInfo.email.trim()) newErrors.email = "El email es obligatorio"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
          newErrors.email = "Email inválido"
        }
        if (!customerInfo.phone.trim()) newErrors.phone = "El teléfono es obligatorio"
        break

      case 2: // Shipping Info
        if (!shippingInfo.address.trim()) newErrors.address = "La dirección es obligatoria"
        if (!shippingInfo.city.trim()) newErrors.city = "La ciudad es obligatoria"
        if (!shippingInfo.postalCode.trim()) newErrors.postalCode = "El código postal es obligatorio"
        if (!shippingInfo.province.trim()) newErrors.province = "La provincia es obligatoria"
        break

      case 3: // Preferences - no validation needed
        break

      case 4: // Payment Info
        if (paymentInfo.method === "card") {
          if (!paymentInfo.cardNumber?.trim()) newErrors.cardNumber = "El número de tarjeta es obligatorio"
          if (!paymentInfo.expiryDate?.trim()) newErrors.expiryDate = "La fecha de vencimiento es obligatoria"
          if (!paymentInfo.cvv?.trim()) newErrors.cvv = "El CVV es obligatorio"
          if (!paymentInfo.cardName?.trim()) newErrors.cardName = "El nombre del titular es obligatorio"
        }
        break

      case 5: // Review
        if (!agreedToTerms) newErrors.terms = "Debes aceptar los términos y condiciones"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(5)) return

    setIsSubmitting(true)
    try {
      const { supabase } = await import("@/lib/supabase")

      const reservationData = {
        bag: selectedBag,
        dates: reservationDates,
        customer: customerInfo,
        shipping: shippingInfo,
        payment: paymentInfo,
        preferences,
        pricing,
        timestamp: new Date().toISOString(),
        reservationId: `RES-${Date.now()}`,
      }

      const { data, error } = await supabase
        .from("reservations")
        .insert([
          {
            user_id: customerInfo.email, // Using email as identifier for now
            bag_id: selectedBag.id,
            start_date: reservationDates.startDate.toISOString(),
            end_date: reservationDates.endDate.toISOString(),
            total_amount: pricing.total,
            status: "pending",
            customer_info: customerInfo,
            shipping_info: shippingInfo,
            payment_info: { method: paymentInfo.method }, // Don't store sensitive payment data
            preferences: preferences,
            created_at: new Date().toISOString(),
          },
        ])
        .select()

      if (error) {
        console.error("[v0] ❌ Error storing reservation in Supabase:", error)
        setErrors({ general: "Error al procesar la reserva. Inténtalo de nuevo." })
        return
      }

      console.log("[v0] ✅ Reserva guardada en Supabase exitosamente")
      onSubmit?.(reservationData)
    } catch (error) {
      console.error("[v0] ❌ Error en reserva:", error)
      setErrors({ general: "Error al procesar la reserva. Inténtalo de nuevo." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const occasionTypes = [
    "Trabajo/Oficina",
    "Eventos sociales",
    "Cenas elegantes",
    "Viajes",
    "Bodas",
    "Reuniones importantes",
    "Ocasiones especiales",
    "Uso diario",
  ]

  const membershipColors = {
    essentiel: "bg-rose-nude text-slate-900",
    signature: "bg-rose-pastel/50 text-slate-900",
    prive: "bg-indigo-dark text-white",
  }

  const membershipNames = {
    essentiel: "L'Essentiel",
    signature: "Signature",
    prive: "Privé",
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress indicator */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif text-slate-900">Completar Reserva</h2>
            <span className="text-sm text-slate-500">
              Paso {currentStep} de {totalSteps}
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-dark h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          <div className="flex justify-between mt-4 text-xs text-slate-600">
            <span className={currentStep >= 1 ? "text-indigo-dark font-medium" : ""}>Cliente</span>
            <span className={currentStep >= 2 ? "text-indigo-dark font-medium" : ""}>Envío</span>
            <span className={currentStep >= 3 ? "text-indigo-dark font-medium" : ""}>Preferencias</span>
            <span className={currentStep >= 4 ? "text-indigo-dark font-medium" : ""}>Pago</span>
            <span className={currentStep >= 5 ? "text-indigo-dark font-medium" : ""}>Revisión</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              {/* Step 1: Customer Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <User className="h-6 w-6 text-indigo-dark mr-3" />
                    <h3 className="text-xl font-semibold text-slate-900">Información Personal</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName">Nombre *</Label>
                      <Input
                        id="firstName"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, firstName: e.target.value }))}
                        placeholder="María"
                        className={errors.firstName ? "border-red-300" : ""}
                      />
                      {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="lastName">Apellidos *</Label>
                      <Input
                        id="lastName"
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, lastName: e.target.value }))}
                        placeholder="García López"
                        className={errors.lastName ? "border-red-300" : ""}
                      />
                      {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="maria@ejemplo.com"
                        className={errors.email ? "border-red-300" : ""}
                      />
                      {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+34 600 000 000"
                        className={errors.phone ? "border-red-300" : ""}
                      />
                      {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <Label htmlFor="birthDate">Fecha de nacimiento (opcional)</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={customerInfo.birthDate}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, birthDate: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="membershipType">Tipo de membresía</Label>
                      <select
                        id="membershipType"
                        value={customerInfo.membershipType}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({ ...prev, membershipType: e.target.value as any }))
                        }
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="essentiel">L'Essentiel</option>
                        <option value="signature">Signature</option>
                        <option value="prive">Privé</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Shipping Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <MapPin className="h-6 w-6 text-indigo-dark mr-3" />
                    <h3 className="text-xl font-semibold text-slate-900">Información de Envío</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="address">Dirección completa *</Label>
                      <Input
                        id="address"
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="Calle Serrano, 21, 3º A"
                        className={errors.address ? "border-red-300" : ""}
                      />
                      {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">Ciudad *</Label>
                        <Input
                          id="city"
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="Madrid"
                          className={errors.city ? "border-red-300" : ""}
                        />
                        {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                      </div>

                      <div>
                        <Label htmlFor="postalCode">Código Postal *</Label>
                        <Input
                          id="postalCode"
                          value={shippingInfo.postalCode}
                          onChange={(e) => setShippingInfo((prev) => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="28001"
                          className={errors.postalCode ? "border-red-300" : ""}
                        />
                        {errors.postalCode && <p className="text-sm text-red-600 mt-1">{errors.postalCode}</p>}
                      </div>

                      <div>
                        <Label htmlFor="province">Provincia *</Label>
                        <Input
                          id="province"
                          value={shippingInfo.province}
                          onChange={(e) => setShippingInfo((prev) => ({ ...prev, province: e.target.value }))}
                          placeholder="Madrid"
                          className={errors.province ? "border-red-300" : ""}
                        />
                        {errors.province && <p className="text-sm text-red-600 mt-1">{errors.province}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="preferredDeliveryTime">Horario preferido de entrega</Label>
                      <select
                        id="preferredDeliveryTime"
                        value={shippingInfo.preferredDeliveryTime}
                        onChange={(e) =>
                          setShippingInfo((prev) => ({ ...prev, preferredDeliveryTime: e.target.value as any }))
                        }
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="any">Cualquier momento</option>
                        <option value="morning">Mañana (9:00 - 14:00)</option>
                        <option value="afternoon">Tarde (14:00 - 18:00)</option>
                        <option value="evening">Noche (18:00 - 21:00)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="specialInstructions">Instrucciones especiales (opcional)</Label>
                      <Textarea
                        id="specialInstructions"
                        value={shippingInfo.specialInstructions || ""}
                        onChange={(e) => setShippingInfo((prev) => ({ ...prev, specialInstructions: e.target.value }))}
                        placeholder="Ej: Llamar antes de subir, portero automático, etc."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isBusinessAddress"
                        checked={shippingInfo.isBusinessAddress}
                        onChange={(e) => setShippingInfo((prev) => ({ ...prev, isBusinessAddress: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="isBusinessAddress">Es una dirección comercial</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Preferences */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <Package className="h-6 w-6 text-indigo-dark mr-3" />
                    <h3 className="text-xl font-semibold text-slate-900">Preferencias de Servicio</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium mb-4 block">¿Para qué ocasiones usarás el bolso?</Label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {occasionTypes.map((occasion) => (
                          <label key={occasion} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.occasionType.includes(occasion)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPreferences((prev) => ({
                                    ...prev,
                                    occasionType: [...prev.occasionType, occasion],
                                  }))
                                } else {
                                  setPreferences((prev) => ({
                                    ...prev,
                                    occasionType: prev.occasionType.filter((t) => t !== occasion),
                                  }))
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{occasion}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-4 block">Nivel de seguro</Label>
                      <div className="space-y-3">
                        {[
                          { value: "basic", label: "Básico", description: "Cobertura estándar incluida", price: "5%" },
                          {
                            value: "premium",
                            label: "Premium",
                            description: "Cobertura extendida contra daños",
                            price: "10%",
                          },
                          {
                            value: "luxury",
                            label: "Luxury",
                            description: "Cobertura completa + reemplazo",
                            price: "15%",
                          },
                        ].map((insurance) => (
                          <label
                            key={insurance.value}
                            className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name="insuranceLevel"
                              value={insurance.value}
                              checked={preferences.insuranceLevel === insurance.value}
                              onChange={(e) =>
                                setPreferences((prev) => ({ ...prev, insuranceLevel: e.target.value as any }))
                              }
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{insurance.label}</span>
                                <span className="text-sm text-slate-600">+{insurance.price}</span>
                              </div>
                              <p className="text-sm text-slate-600">{insurance.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-4 block">Método de devolución preferido</Label>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                          <input
                            type="radio"
                            name="returnMethod"
                            value="shipping"
                            checked={preferences.returnMethod === "shipping"}
                            onChange={(e) =>
                              setPreferences((prev) => ({ ...prev, returnMethod: e.target.value as any }))
                            }
                          />
                          <div>
                            <span className="font-medium">Envío de recogida</span>
                            <p className="text-sm text-slate-600">Programaremos la recogida en tu domicilio</p>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                          <input
                            type="radio"
                            name="returnMethod"
                            value="pickup"
                            checked={preferences.returnMethod === "pickup"}
                            onChange={(e) =>
                              setPreferences((prev) => ({ ...prev, returnMethod: e.target.value as any }))
                            }
                          />
                          <div>
                            <span className="font-medium">Recogida en tienda</span>
                            <p className="text-sm text-slate-600">Entrega el bolso en nuestro showroom</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">Solicitudes especiales (opcional)</Label>
                      <Textarea
                        id="specialRequests"
                        value={preferences.specialRequests || ""}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, specialRequests: e.target.value }))}
                        placeholder="Cualquier solicitud especial o comentario adicional..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Payment Information */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <CreditCard className="h-6 w-6 text-indigo-dark mr-3" />
                    <h3 className="text-xl font-semibold text-slate-900">Información de Pago</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium mb-4 block">Método de pago</Label>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={paymentInfo.method === "card"}
                            onChange={(e) => setPaymentInfo((prev) => ({ ...prev, method: e.target.value as any }))}
                          />
                          <CreditCard className="h-5 w-5" />
                          <span>Tarjeta de crédito/débito</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="paypal"
                            checked={paymentInfo.method === "paypal"}
                            onChange={(e) => setPaymentInfo((prev) => ({ ...prev, method: e.target.value as any }))}
                          />
                          <div className="w-5 h-5 bg-blue-600 rounded"></div>
                          <span>PayPal</span>
                        </label>
                      </div>
                    </div>

                    {paymentInfo.method === "card" && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardNumber">Número de tarjeta *</Label>
                          <Input
                            id="cardNumber"
                            value={paymentInfo.cardNumber || ""}
                            onChange={(e) => setPaymentInfo((prev) => ({ ...prev, cardNumber: e.target.value }))}
                            placeholder="1234 5678 9012 3456"
                            className={errors.cardNumber ? "border-red-300" : ""}
                          />
                          {errors.cardNumber && <p className="text-sm text-red-600 mt-1">{errors.cardNumber}</p>}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate">Fecha de vencimiento *</Label>
                            <Input
                              id="expiryDate"
                              value={paymentInfo.expiryDate || ""}
                              onChange={(e) => setPaymentInfo((prev) => ({ ...prev, expiryDate: e.target.value }))}
                              placeholder="MM/AA"
                              className={errors.expiryDate ? "border-red-300" : ""}
                            />
                            {errors.expiryDate && <p className="text-sm text-red-600 mt-1">{errors.expiryDate}</p>}
                          </div>

                          <div>
                            <Label htmlFor="cvv">CVV *</Label>
                            <Input
                              id="cvv"
                              value={paymentInfo.cvv || ""}
                              onChange={(e) => setPaymentInfo((prev) => ({ ...prev, cvv: e.target.value }))}
                              placeholder="123"
                              className={errors.cvv ? "border-red-300" : ""}
                            />
                            {errors.cvv && <p className="text-sm text-red-600 mt-1">{errors.cvv}</p>}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="cardName">Nombre del titular *</Label>
                          <Input
                            id="cardName"
                            value={paymentInfo.cardName || ""}
                            onChange={(e) => setPaymentInfo((prev) => ({ ...prev, cardName: e.target.value }))}
                            placeholder="María García López"
                            className={errors.cardName ? "border-red-300" : ""}
                          />
                          {errors.cardName && <p className="text-sm text-red-600 mt-1">{errors.cardName}</p>}
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="saveCard"
                            checked={paymentInfo.saveCard}
                            onChange={(e) => setPaymentInfo((prev) => ({ ...prev, saveCard: e.target.checked }))}
                            className="rounded"
                          />
                          <Label htmlFor="saveCard">Guardar tarjeta para futuras compras</Label>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start">
                        <Shield className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-900 mb-1">Pago 100% seguro</h4>
                          <p className="text-green-700 text-sm">
                            Tu información está protegida con encriptación SSL de 256 bits. No almacenamos datos de
                            tarjetas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <CheckCircle2 className="h-6 w-6 text-indigo-dark mr-3" />
                    <h3 className="text-xl font-semibold text-slate-900">Revisión Final</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Customer summary */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-medium mb-2">Cliente</h4>
                      <p className="text-sm text-slate-700">
                        {customerInfo.firstName} {customerInfo.lastName}
                        <br />
                        {customerInfo.email}
                        <br />
                        {customerInfo.phone}
                      </p>
                    </div>

                    {/* Shipping summary */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-medium mb-2">Dirección de envío</h4>
                      <p className="text-sm text-slate-700">
                        {shippingInfo.address}
                        <br />
                        {shippingInfo.city}, {shippingInfo.postalCode}
                        <br />
                        {shippingInfo.province}
                      </p>
                    </div>

                    {/* Terms acceptance */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="agreedToTerms"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 rounded"
                        />
                        <Label htmlFor="agreedToTerms" className="text-sm">
                          Acepto los{" "}
                          <a href="/legal/terms" className="text-indigo-dark underline">
                            términos y condiciones
                          </a>{" "}
                          y la{" "}
                          <a href="/legal/privacy" className="text-indigo-dark underline">
                            política de privacidad
                          </a>
                        </Label>
                      </div>
                      {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}
                    </div>

                    {errors.general && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                          <p className="text-red-700">{errors.general}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={currentStep === 1 ? onCancel : prevStep}
                  className="border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {currentStep === 1 ? "Cancelar" : "Anterior"}
                </Button>

                {currentStep < totalSteps ? (
                  <Button onClick={nextStep} className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
                  >
                    {isSubmitting ? "Procesando..." : "Confirmar Reserva"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with bag details and pricing */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Bag details */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Resumen de Reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden">
                  <img
                    src={selectedBag.images[0] || "/placeholder.svg"}
                    alt={selectedBag.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-xs ${membershipColors[selectedBag.membershipType]}`}>
                      {membershipNames[selectedBag.membershipType]}
                    </Badge>
                  </div>
                  <h4 className="font-serif text-lg text-slate-900">{selectedBag.name}</h4>
                  <p className="text-slate-600">{selectedBag.brand}</p>
                  <p className="text-sm text-slate-500 mt-2">
                    {selectedBag.color} • {selectedBag.material}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                    <span>
                      {reservationDates.startDate.toLocaleDateString()} -{" "}
                      {reservationDates.endDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-slate-500" />
                    <span>{reservationDates.totalDays} días</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing breakdown */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Desglose de Precio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Tarifa diaria (€{pricing.dailyRate})</span>
                  <span>€{pricing.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Seguro ({preferences.insuranceLevel})</span>
                  <span>€{pricing.insuranceFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Envío</span>
                  <span>{pricing.deliveryFee === "0.00" ? "Gratis" : `€${pricing.deliveryFee}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>€{pricing.total}</span>
                </div>

                <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" />
                    <p className="text-xs text-indigo-800">
                      El pago se procesará al confirmar la reserva. Recibirás el bolso en 24-48 horas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
