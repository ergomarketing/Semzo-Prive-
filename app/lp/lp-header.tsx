import Image from "next/image"

/**
 * Banner con el logo de Semzo Privé para las landings de Google Ads (/lp/*).
 * Solo el logo, sin menu ni enlaces: cero distracciones antes del CTA.
 * Va superpuesto en lo alto de la primera pantalla (position absolute) para no
 * empujar el contenido y que el titular y el boton sigan viendose sin scroll.
 */
export default function LpHeader() {
  const textStyle = {
    color: "#1a2c4e",
    fontFamily: "var(--font-playfair), Playfair Display, Georgia, serif",
  }

  return (
    <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-center bg-white px-6 py-3 shadow-sm md:justify-start md:px-14 lg:px-20">
      <span className="text-lg font-light tracking-[0.15em] sm:text-xl" style={textStyle}>
        SEMZO
      </span>
      <Image
        src="/images/sp-monogram-v2.png"
        alt="Semzo Privé"
        width={40}
        height={50}
        className="mx-1 object-contain sm:mx-2"
        priority
      />
      <span className="text-lg font-light tracking-[0.15em] sm:text-xl" style={textStyle}>
        PRIVÉ
      </span>
    </header>
  )
}
