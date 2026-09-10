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
  welcome: {
    subject: "Welcome to Semzo Privé! Confirm your account",
    preheader: "Confirm your account and access the exclusive Semzo Privé collection.",
    eyebrow: "Welcome",
    heading: (name: string) => `Welcome to the club, ${name}`,
    intro:
      "We're delighted to welcome you to our exclusive community. At Semzo Privé you'll find a carefully curated selection of the most sought-after luxury handbags.",
    confirmPrompt: "To start your experience, please confirm your email address:",
    benefitsTitle: "With your account confirmed you'll get access to:",
    benefits: [
      "Private collections",
      "Exclusive offers for members",
      "Early-access events and launches",
      "Personal styling advice",
    ],
    cta: "Confirm my account",
    footerNote: "If you didn't create this account, you can safely ignore this email.",
  },
  membershipActivated: {
    subject: "Your membership is active — Semzo Privé",
    eyebrow: "Membership activated",
    heading: (plan: string) => `Welcome to ${plan}`,
    intro: (plan: string) => `Your ${plan} membership has been activated successfully.`,
    cta: "Go to my account",
  },
  membershipRenewed: {
    subject: "Renewal confirmed — Semzo Privé",
    eyebrow: "Renewal",
    heading: "Renewal confirmed",
    intro: (plan: string) => `Your ${plan} membership has been renewed successfully.`,
    cta: "View my account",
  },
  ownershipCompleted: {
    subject: "Your bag is now yours — Semzo Privé",
    eyebrow: "Ownership transferred",
    heading: "Your bag is now yours",
    intro: (bag: string) => `The ${bag} bag is now part of your personal collection.`,
    cta: "View my collection",
  },
  giftCardRecipient: {
    subject: (amount: string) => `You've received a Semzo Privé Gift Card - €${amount}`,
    eyebrow: "Gift Card",
    heading: "You've received a gift!",
    intro: (from: string) => `${from} has gifted you a Semzo Privé Gift Card.`,
    codeLabel: "Your Gift Card code",
    amountLabel: "Amount",
    cta: "Redeem my Gift Card",
  },
  dunning: {
    e1: {
      subject: "A gentle reminder — Semzo Privé",
      heading: "A gentle reminder",
      intro: (plan: string) =>
        `We tried to process the renewal of your ${plan} membership and it looks like there was a small hiccup with your payment method.`,
      body: "Don't worry, this happens. You can update it anytime from your member area and your membership will continue without interruption.",
    },
    e2: {
      subject: "Shall we update your payment method together? — Semzo Privé",
      heading: "Shall we update your payment method?",
      intro: (plan: string) =>
        `We're reaching out because your ${plan} membership payment is still pending. We want to make sure you can keep enjoying Semzo Privé without interruption.`,
      body: "Updating your payment method is quick and only takes a moment.",
    },
    e3: {
      subject: "We're still here to help with your membership — Semzo Privé",
      heading: "We're still here to help",
      intro: (plan: string) =>
        `We'd love for your ${plan} membership to continue with us. Your renewal payment is still pending and we want to find the best solution for you.`,
      body: "If now isn't the right time or you'd prefer to pause, let us know: we're here to listen and help you manage your membership however works best for you.",
    },
    bagNote: (bag: string) => `Remember you currently have the ${bag} bag with you. It will stay with you unchanged while you sort out the payment.`,
    cta: "Update payment method",
    help: "If you've already updated it or need help, write to us and we'll get right on it.",
  },
  returnReminder: {
    subjectPetite: (bag: string) => `Your ${bag} bag is heading back soon — Semzo Privé`,
    subjectDefault: "Reminder: your bag return is due in 2 days — Semzo Privé",
    subtitlePetite: "Your week with this bag is coming to an end",
    subtitleDefault: "It'll soon be time to say goodbye to this bag",
    intro: (bag: string, date: string) =>
      `Just a friendly reminder that your ${bag} bag period ends on ${date}.`,
    body: "When the time comes, simply arrange the return from your member area and we'll take care of the entire pickup process.",
    returnByLabel: "Return date",
    notePetite: "The 7-day period is counted from the day you received the bag.",
    noteDefault: "Remember to prepare the bag with its original dust bag and accessories.",
    cta: "Go to my member area",
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
  sepaPreExecution: {
    subject: "Pre-Execution Notice for SEPA Mandate - Action Required",
    heading: "Pre-Execution Notice for SEPA Mandate",
  },
  sepaExecution: {
    subject: "SEPA Charge Execution Confirmation - Semzo Privé",
    heading: "SEPA Mandate Execution Confirmation",
  },
}
