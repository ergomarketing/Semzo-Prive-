// Funciones de ayuda para trackear eventos específicos

// Trackear evento en Facebook Pixel
export function trackFacebookEvent(eventName: string, params?: any) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params)
  }
}

// Trackear evento en Google Analytics
export function trackGoogleEvent(eventName: string, params?: any) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params)
  }
}

// Eventos específicos de Semzo
export const trackEvents = {
  // Eventos de registro y autenticación
  signUp: (membershipType: string) => {
    trackFacebookEvent("CompleteRegistration", { membership_type: membershipType })
    trackGoogleEvent("sign_up", { membership_type: membershipType })
  },

  login: () => {
    trackFacebookEvent("Login")
    trackGoogleEvent("login")
  },

  // Eventos de checkout
  startCheckout: (membershipType: string, price: number) => {
    trackFacebookEvent("InitiateCheckout", {
      membership_type: membershipType,
      value: price,
      currency: "EUR",
    })
    trackGoogleEvent("begin_checkout", {
      items: [
        {
          item_name: `Membresía ${membershipType}`,
          price: price,
        },
      ],
      value: price,
      currency: "EUR",
    })
  },

  purchase: (membershipType: string, price: number, transactionId: string) => {
    trackFacebookEvent("Purchase", {
      membership_type: membershipType,
      value: price,
      currency: "EUR",
      transaction_id: transactionId,
    })
    trackGoogleEvent("purchase", {
      transaction_id: transactionId,
      value: price,
      currency: "EUR",
      items: [
        {
          item_name: `Membresía ${membershipType}`,
          price: price,
        },
      ],
    })
  },

  // Eventos de catálogo
  viewBag: (bagName: string, bagBrand: string) => {
    trackFacebookEvent("ViewContent", {
      content_type: "product",
      content_name: bagName,
      content_category: bagBrand,
    })
    trackGoogleEvent("view_item", {
      items: [
        {
          item_name: bagName,
          item_brand: bagBrand,
        },
      ],
    })
  },

  addToWishlist: (bagName: string, bagBrand: string) => {
    trackFacebookEvent("AddToWishlist", {
      content_type: "product",
      content_name: bagName,
      content_category: bagBrand,
    })
    trackGoogleEvent("add_to_wishlist", {
      items: [
        {
          item_name: bagName,
          item_brand: bagBrand,
        },
      ],
    })
  },

  // Eventos de referidos
  shareReferral: (method: string) => {
    trackFacebookEvent("Share", { method: method })
    trackGoogleEvent("share", { method: method })
  },

  referralSignup: (referrerId: string) => {
    trackFacebookEvent("CustomizeProduct", { referrer_id: referrerId })
    trackGoogleEvent("join_group", { referrer_id: referrerId })
  },
}
