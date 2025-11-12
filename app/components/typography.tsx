import type React from "react"
interface HeadingProps {
  children: React.ReactNode
  className?: string
}

export function H1({ children, className = "" }: HeadingProps) {
  return <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight ${className}`}>{children}</h1>
}

export function H2({ children, className = "" }: HeadingProps) {
  return <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight ${className}`}>{children}</h2>
}

export function LeadText({ children, className = "" }: HeadingProps) {
  return <p className={`text-lg md:text-xl text-muted-foreground ${className}`}>{children}</p>
}
