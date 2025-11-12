import Head from "next/head"

interface SEOHeadProps {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  noindex?: boolean
}

export default function SEOHead({
  title = "Semzo Privé | Membresía Exclusiva de Bolsos de Lujo",
  description = "El arte de poseer sin comprar. Accede a una colección curada de bolsos de lujo de las marcas más prestigiosas del mundo mediante nuestra membresía exclusiva.",
  canonical,
  ogImage = "/og-image.jpg",
  noindex = false,
}: SEOHeadProps) {
  const fullTitle = title.includes("Semzo Privé") ? title : `${title} | Semzo Privé`

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Robots */}
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Semzo Privé" />
      <meta property="og:locale" content="es_ES" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO */}
      <meta name="author" content="Semzo Privé" />
      <meta
        name="keywords"
        content="bolsos de lujo, membresía exclusiva, alquiler de bolsos, moda circular, bolsos de diseñador, Chanel, Louis Vuitton, Hermès, Dior, Gucci, suscripción de moda, lujo sostenible"
      />

      {/* Geo Tags */}
      <meta name="geo.region" content="ES-MD" />
      <meta name="geo.placename" content="Madrid" />
      <meta name="geo.position" content="40.4168;-3.7038" />
      <meta name="ICBM" content="40.4168, -3.7038" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    </Head>
  )
}
