import Link from "next/link"

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
            © {new Date().getFullYear()} Semzo Privé — Marca y plataforma de servicio premium de alquiler de artículos
            de lujo.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="https://www.instagram.com/semzoprive/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/semzoprive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://www.tiktok.com/@semzoprive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              TikTok
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
