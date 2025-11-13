export default function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Semzo Privé",
    url: "https://semzoprive.com",
    logo: "https://semzoprive.com/logo.png",
    description: "Servicio de suscripción de bolsos de lujo en España",
    address: {
      "@type": "PostalAddress",
      addressCountry: "ES",
      addressLocality: "Madrid",
    },
    sameAs: ["https://instagram.com/semzoprive", "https://facebook.com/semzoprive"],
    offers: {
      "@type": "Offer",
      name: "Membresía Premium",
      description: "Acceso mensual a bolsos de lujo de diseñador",
      price: "99.00",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
