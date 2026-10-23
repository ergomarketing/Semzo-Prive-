import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Tarjetas del panel de socias: mismo API que components/ui/card, con el estilo del panel
 * (marco fino azul de marca, fondo translucido, titulos serif). Solo las usan las paginas de /dashboard.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border border-indigo-dark/10 bg-white/80 text-slate-800 shadow-none backdrop-blur", className)}
    {...props}
  />
))
Card.displayName = "PanelCard"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "PanelCardHeader"

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("font-serif text-xl font-normal leading-tight tracking-tight text-indigo-dark", className)} {...props} />
))
CardTitle.displayName = "PanelCardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm text-slate-500", className)} {...props} />
))
CardDescription.displayName = "PanelCardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "PanelCardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
))
CardFooter.displayName = "PanelCardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
