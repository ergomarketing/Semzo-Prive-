export default function SPLogo({
  size = 64,
  color = "#1a2c4e",
  className = "",
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Letra S estilizada con curvas elegantes */}
      <path
        d="M50 8C35 8 24 18 24 30C24 42 32 48 45 52C58 56 64 60 64 70C64 80 56 88 42 88"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Curva superior de la S */}
      <path d="M42 88C28 88 18 80 18 68" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* Letra P integrada - tallo vertical */}
      <path d="M50 35L50 112" stroke={color} strokeWidth="5" strokeLinecap="round" />

      {/* Letra P - curva del lazo superior */}
      <path
        d="M50 35C50 35 52 25 62 25C72 25 80 32 80 44C80 56 72 62 62 62C52 62 50 55 50 55"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Base decorativa del tallo */}
      <path d="M42 112L58 112" stroke={color} strokeWidth="4" strokeLinecap="round" />

      {/* Serif decorativo izquierdo en la base */}
      <path d="M38 110C40 112 42 112 42 112" stroke={color} strokeWidth="3" strokeLinecap="round" />

      {/* Serif decorativo derecho en la base */}
      <path d="M62 110C60 112 58 112 58 112" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
