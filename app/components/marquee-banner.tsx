"use client"

export default function MarqueeBanner() {
  const text = "Alquiler de bolsos de lujo mediante membresía"
  const separator = "   ✦   "
  
  // Repetimos el texto varias veces para crear el efecto continuo
  const repeatedText = Array(8).fill(`${text}${separator}`).join("")

  return (
    // CLS FIX: altura minima fija para reservar espacio durante SSR.
    // Como este componente es "use client", durante el render inicial
    // ocupa 0px y al hidratarse anade ~32px, empujando TODO el contenido
    // de abajo y aportando ~0.2-0.4 al CLS.
    // h-9 = 36px, exactamente la altura final con py-2 + line-height.
    <div className="bg-[#1a1a4b] overflow-hidden h-9 flex items-center">
      <div className="animate-marquee whitespace-nowrap">
        <span className="text-xs md:text-sm uppercase tracking-[0.2em] text-white/90 font-light">
          {repeatedText}
        </span>
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
