import type { Messages } from "./es"

export const en: Messages = {
  common: {
    brand: "Semzo Privé",
    tagline: "Luxury handbag maison",
    address: "Avenida Ricardo Soriano, Marbella, Spain",
    supportEmail: "soporte@semzoprive.com",
    fromEmail: "hola@semzoprive.com",
    site: "https://semzoprive.com",
    unsubscribe: "Unsubscribe",
    rightsReserved: "All rights reserved.",
    hello: (name: string) => `Hello, ${name}`,
  },
  newsletter: {
    subject: "Welcome to our newsletter! - Semzo Privé",
    heading: "Thank you for subscribing",
    intro:
      "From now on you'll receive our latest news: new collection pieces, exclusive offers, and curated trends.",
  },
  admin: {
    eyebrow: "Internal notice",
    footerNote: "Automated email from the Semzo Privé system.",
  },
}
