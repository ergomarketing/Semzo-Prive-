export const es = {
  common: {
    brand: "Semzo Privé",
    tagline: "Maison de bolsos de lujo",
    address: "Avenida Ricardo Soriano, Marbella, España",
    supportEmail: "soporte@semzoprive.com",
    fromEmail: "hola@semzoprive.com",
    site: "https://semzoprive.com",
    unsubscribe: "Darse de baja",
    rightsReserved: "Todos los derechos reservados.",
    hello: (name: string) => `Hola, ${name}`,
  },
  newsletter: {
    subject: "¡Bienvenida a nuestro newsletter! - Semzo Privé",
    heading: "Gracias por suscribirte",
    intro:
      "A partir de ahora recibirás nuestras novedades: nuevas piezas de la colección, ofertas exclusivas y tendencias seleccionadas.",
  },
  admin: {
    eyebrow: "Aviso interno",
    footerNote: "Correo automático del sistema Semzo Privé.",
  },
}

export type Messages = typeof es
