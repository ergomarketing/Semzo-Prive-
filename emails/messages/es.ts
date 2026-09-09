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
  welcome: {
    subject: "¡Bienvenida a Semzo Privé! Confirma tu cuenta",
    preheader: "Confirma tu cuenta y accede a la colección exclusiva de Semzo Privé.",
    eyebrow: "Bienvenida",
    heading: (name: string) => `Bienvenida al club, ${name}`,
    intro:
      "Nos alegra darte la bienvenida a nuestra comunidad exclusiva. En Semzo Privé encontrarás una selección cuidadosamente curada de los bolsos de lujo más deseados.",
    confirmPrompt: "Para comenzar tu experiencia, confirma tu dirección de correo:",
    benefitsTitle: "Con tu cuenta confirmada tendrás acceso a:",
    benefits: [
      "Colecciones privadas",
      "Ofertas exclusivas para socias",
      "Eventos y lanzamientos anticipados",
      "Asesoramiento personalizado",
    ],
    cta: "Confirmar mi cuenta",
    footerNote: "Si no creaste esta cuenta, puedes ignorar este correo de forma segura.",
  },
  membershipActivated: {
    subject: "Tu membresía está activa — Semzo Privé",
    eyebrow: "Membresía activada",
    heading: (plan: string) => `Bienvenida a ${plan}`,
    intro: (plan: string) => `Tu membresía ${plan} ha sido activada exitosamente.`,
    cta: "Ir a mi cuenta",
  },
  membershipRenewed: {
    subject: "Renovación confirmada — Semzo Privé",
    eyebrow: "Renovación",
    heading: "Renovación confirmada",
    intro: (plan: string) => `Tu membresía ${plan} se ha renovado correctamente.`,
    cta: "Ver mi cuenta",
  },
  ownershipCompleted: {
    subject: "Tu bolso ya es tuyo — Semzo Privé",
    eyebrow: "Propiedad transferida",
    heading: "Tu bolso ya es tuyo",
    intro: (bag: string) => `El bolso ${bag} ya forma parte de tu colección personal.`,
    cta: "Ver mi colección",
  },
  giftCardRecipient: {
    subject: (amount: string) => `Has recibido una Gift Card de Semzo Privé - ${amount}€`,
    eyebrow: "Gift Card",
    heading: "¡Has recibido un regalo!",
    intro: (from: string) => `${from} te ha regalado una Gift Card de Semzo Privé.`,
    codeLabel: "Código de tu Gift Card",
    amountLabel: "Importe",
    cta: "Canjear mi Gift Card",
  },
  dunning: {
    e1: {
      subject: "Un pequeño recordatorio — Semzo Privé",
      heading: "Un pequeño recordatorio",
      intro: (plan: string) =>
        `Hemos intentado procesar la renovación de tu membresía ${plan} y parece que ha habido un pequeño contratiempo con el método de pago.`,
      body: "No te preocupes, estas cosas pasan. Puedes actualizarlo en cualquier momento desde tu área de socia y tu membresía continuará sin interrupciones.",
    },
    e2: {
      subject: "¿Actualizamos juntas tu método de pago? — Semzo Privé",
      heading: "¿Actualizamos tu método de pago?",
      intro: (plan: string) =>
        `Nos permitimos escribirte porque tu membresía ${plan} sigue pendiente de pago. Queremos asegurarnos de que puedas seguir disfrutando de Semzo Privé sin ninguna interrupción.`,
      body: "Actualizar tu método de pago es muy sencillo y solo te llevará un momento.",
    },
    e3: {
      subject: "Seguimos aquí para ayudarte con tu membresía — Semzo Privé",
      heading: "Seguimos aquí para ayudarte",
      intro: (plan: string) =>
        `Nos gustaría que tu membresía ${plan} continuara con nosotras. El pago de tu renovación sigue pendiente y queremos encontrar la mejor solución para ti.`,
      body: "Si en este momento no es el momento adecuado o prefieres hacer una pausa, cuéntanoslo: estamos aquí para escucharte y ayudarte a gestionar tu membresía de la manera que mejor te venga.",
    },
    bagNote: (bag: string) => `Recuerda que actualmente tienes contigo el bolso ${bag}. Estará contigo sin cambios mientras regularizas el pago.`,
    cta: "Actualizar método de pago",
    help: "Si ya lo has actualizado o necesitas ayuda, escríbenos y te atendemos enseguida.",
  },
  returnReminder: {
    subjectPetite: (bag: string) => `Tu bolso ${bag} regresa pronto — Semzo Privé`,
    subjectDefault: "Recordatorio: devolución de tu bolso en 2 días — Semzo Privé",
    subtitlePetite: "Tu semana con este bolso está llegando a su fin",
    subtitleDefault: "Pronto toca despedirse de este bolso",
    intro: (bag: string, date: string) =>
      `Queremos recordarte con cariño que el periodo de tu bolso ${bag} finaliza el próximo ${date}.`,
    body: "Cuando llegue el momento, simplemente coordina la devolución desde tu área de socia y nosotras nos encargamos de todo el proceso de recogida.",
    returnByLabel: "Fecha de devolución",
    notePetite: "El periodo de 7 días se cuenta desde que recibiste el bolso.",
    noteDefault: "Recuerda preparar el bolso con su funda y accesorios originales.",
    cta: "Ir a mi área de socia",
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
  sepaPreExecution: {
    subject: "Aviso Previo a Ejecución de Mandato SEPA - Acción Requerida",
    heading: "Aviso Previo a Ejecución de Mandato SEPA",
  },
  sepaExecution: {
    subject: "Confirmación de Cargo SEPA Ejecutado - Semzo Privé",
    heading: "Confirmación de Ejecución de Mandato SEPA",
  },
}

export type Messages = typeof es
