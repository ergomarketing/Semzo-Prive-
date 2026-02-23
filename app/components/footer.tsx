import Link from "next/link"
import { Instagram, Facebook } from "lucide-react"

export { Footer }

export default function Footer() {
  return (
    <footer
      className="py-16 border-t"
      style={{
        background:
          "linear-gradient(135deg, rgba(26, 26, 75, 0.08) 0%, rgba(42, 42, 91, 0.06) 30%, rgba(138, 107, 143, 0.04) 60%, rgba(196, 155, 163, 0.03) 80%, rgba(244, 196, 204, 0.02) 100%)",
        borderTopColor: "rgba(244, 196, 204, 0.3)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <div className="font-serif text-2xl mb-4" style={{ color: "#1a1a4b" }}>
              Semzo Privé
            </div>
            <p className="text-slate-600 font-light max-w-xs">
              Redefine tu relación con la moda de lujo a través de una experiencia de membresía exclusiva.
            </p>
          </div>

          <div className="md:col-span-2 md:col-start-6">
            <h3 className="text-xs uppercase tracking-widest font-medium mb-6" style={{ color: "#1a1a4b" }}>
              Explorar
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="#coleccion" className="text-slate-500 hover:text-slate-700 transition-colors">
                  Colección
                </Link>
              </li>
              <li>
                <Link href="#membresias" className="text-slate-500 hover:text-slate-700 transition-colors">
                  Membresías
                </Link>
              </li>
              <li>
                <Link href="#como-funciona" className="text-slate-500 hover:text-slate-700 transition-colors">
                  Proceso
                </Link>
              </li>
              <li>
                <Link href="#testimonios" className="text-slate-500 hover:text-slate-700 transition-colors">
                  Testimonios
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs uppercase tracking-widest font-medium mb-6" style={{ color: "#1a1a4b" }}>
              Legal
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/legal/terms" className="text-slate-500 hover:text-slate-700 transition-colors">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-slate-500 hover:text-slate-700 transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-slate-500 hover:text-slate-700 transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs uppercase tracking-widest font-medium mb-6" style={{ color: "#1a1a4b" }}>
              Contacto
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/support" className="text-slate-500 hover:text-slate-700 transition-colors">
                  Centro de Soporte
                </Link>
              </li>
              <li>
                <a href="mailto:info@semzoprive.com" className="text-slate-500 hover:text-slate-700 transition-colors">
                  info@semzoprive.com
                </a>
              </li>
              <li>
                <a href="tel:+34624239394" className="text-slate-500 hover:text-slate-700 transition-colors">
                  +34 624 23 9394
                </a>
              </li>
              <li>
                <address className="text-slate-500 not-italic">
                  Av. Bulevar Príncipe Alfonso de Hohenlohe, s/n
                  <br />
                  Marbella, Málaga
                </address>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-16 pt-8 flex flex-col md:flex-row justify-between items-center p-6 rounded-lg backdrop-blur-sm"
          style={{
            borderTop: "1px solid rgba(244, 196, 204, 0.3)",
            backgroundColor: "rgba(255, 240, 243, 0.2)",
          }}
        >
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} Semzo Privé — Marca y plataforma de servicio premium de alquiler de bolsos de
            lujo auténticos y certificados. Todas nuestras piezas son verificadas por expertos para garantizar
            autenticidad.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="https://www.instagram.com/semzoprive/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com/semzoprive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://www.tiktok.com/@semzoprive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="TikTok"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
            </a>
            <a
              href="https://www.pinterest.com/semzoprive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Pinterest"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0a12 12 0 00-4.37 23.17c-.06-.56-.12-1.42 0-2 .12-.56.72-3.07.72-3.07a4.41 4.41 0 01-.36-1.84c0-1.73 1-3 2.26-3a1.56 1.56 0 011.58 1.76c0 1.07-.68 2.67-1 4.15a1.81 1.81 0 001.83 2.25c2.2 0 3.89-2.32 3.89-5.66a4.75 4.75 0 00-5-4.89 5.26 5.26 0 00-5.47 5.27 4.76 4.76 0 001 2.87.34.34 0 01.08.33c-.09.37-.29 1.16-.33 1.32a.25.25 0 01-.36.18c-1.36-.63-2.21-2.61-2.21-4.21 0-3.42 2.49-6.57 7.18-6.57 3.77 0 6.7 2.69 6.7 6.28 0 3.75-2.36 6.76-5.64 6.76a2.91 2.91 0 01-2.49-1.24l-.68 2.59a11 11 0 01-1.26 2.67A12 12 0 1012 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
