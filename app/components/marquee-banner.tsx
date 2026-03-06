"use client"

export default function MarqueeBanner() {
  const text = "Alquiler de bolsos de lujo mediante membresía"
  const separator = "   ✦   "
  
  // Repetimos el texto varias veces para crear el efecto continuo
  const repeatedText = Array(8).fill(`${text}${separator}`).join("")

  return (
    <div className="bg-[#1a1a4b] overflow-hidden py-2">
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
