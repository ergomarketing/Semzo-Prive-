import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Iniciamos siempre en false para que SSR y primer render cliente coincidan.
  // Tras montar, useEffect ajusta al valor real evitando hydration mismatch.
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
