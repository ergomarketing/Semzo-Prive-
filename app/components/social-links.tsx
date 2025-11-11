import type React from "react"
import { Instagram, Facebook, Twitter } from "lucide-react"
import Link from "next/link"

export default function SocialLinks({ className = "" }) {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <SocialLink href="https://instagram.com/semzoprive" aria-label="Síguenos en Instagram">
        <Instagram className="h-5 w-5" />
      </SocialLink>
      <SocialLink href="https://facebook.com/semzoprive" aria-label="Síguenos en Facebook">
        <Facebook className="h-5 w-5" />
      </SocialLink>
      <SocialLink href="https://twitter.com/semzoprive" aria-label="Síguenos en Twitter">
        <Twitter className="h-5 w-5" />
      </SocialLink>
    </div>
  )
}

function SocialLink({ href, children, ...props }: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      href={href}
      className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </Link>
  )
}
