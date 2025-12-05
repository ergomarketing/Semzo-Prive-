"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface CartItem {
  id: string
  name: string
  price: string
  billingCycle: "weekly" | "monthly" | "quarterly"
  description: string
  image: string
  brand: string
  itemType?: "membership" | "bag-pass"
  period?: "weekly" | "monthly" | "quarterly"
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  addItems: (items: CartItem[]) => void
  removeItem: (id: string) => void
  clearCart: () => void
  itemCount: number
  total: number
  hasMembership: () => boolean
  replaceMembership: (newItems: CartItem[]) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const savedItems = localStorage.getItem("cartItems")
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems))
      } catch (e) {
        console.error("Error parsing cart items:", e)
      }
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("cartItems", JSON.stringify(items))
    }
  }, [items, isHydrated])

  const isMembershipItem = (item: CartItem) => {
    return (
      item.itemType === "membership" ||
      item.itemType === "bag-pass" ||
      item.id.includes("membership") ||
      item.id.includes("bag-pass") ||
      item.id.includes("essentiel") ||
      item.id.includes("signature") ||
      item.id.includes("prive") ||
      item.id.includes("petite") ||
      item.name.toLowerCase().includes("membresía") ||
      item.name.toLowerCase().includes("pase bolso")
    )
  }

  const hasMembership = () => {
    return items.some(isMembershipItem)
  }

  const replaceMembership = (newItems: CartItem[]) => {
    setItems((prevItems) => {
      // Filtrar items que NO son membresías ni bag-pass
      const nonMembershipItems = prevItems.filter((item) => !isMembershipItem(item))
      return [...nonMembershipItems, ...newItems]
    })
  }

  const addItem = (item: CartItem) => {
    setItems((prevItems) => {
      if (isMembershipItem(item)) {
        // Si es una membresía, eliminar todas las membresías anteriores
        const nonMembershipItems = prevItems.filter((i) => !isMembershipItem(i))
        return [...nonMembershipItems, item]
      }
      return [...prevItems, item]
    })
  }

  const addItems = (newItems: CartItem[]) => {
    setItems((prevItems) => {
      const hasNewMembership = newItems.some(isMembershipItem)
      if (hasNewMembership) {
        // Si hay membresías nuevas, eliminar todas las membresías anteriores
        const nonMembershipItems = prevItems.filter((i) => !isMembershipItem(i))
        return [...nonMembershipItems, ...newItems]
      }
      return [...prevItems, ...newItems]
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const itemToRemove = prev.find((item) => item.id === id)
      if (itemToRemove) {
        if (itemToRemove.id.includes("petite-membership")) {
          // Eliminar membresía y bag-pass
          return prev.filter((item) => !item.id.includes("petite-membership") && !item.id.includes("bag-pass"))
        }
        if (itemToRemove.id.includes("bag-pass")) {
          // Eliminar bag-pass y membresía petite
          return prev.filter((item) => !item.id.includes("petite-membership") && !item.id.includes("bag-pass"))
        }
      }
      return prev.filter((item) => item.id !== id)
    })
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem("cartItems")
  }

  const itemCount = items.length

  const total = items.reduce((sum, item) => {
    const priceStr = item.price.replace("€", "").replace(",", ".").trim()
    const price = Number.parseFloat(priceStr)
    return sum + (isNaN(price) ? 0 : price)
  }, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addItems,
        removeItem,
        clearCart,
        itemCount,
        total,
        hasMembership,
        replaceMembership,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
