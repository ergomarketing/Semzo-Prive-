import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/navbar';
import Footer from './components/footer';
import CookieConsent from './components/cookie-consent';
import { ClientProviders } from './providers';

export const metadata: Metadata = {
  title: 'Semzo Privé - Alquiler de Bolsos de Lujo',
  description: 'Accede a los bolsos más exclusivos del mundo con nuestro servicio de alquiler por suscripción.',
  generator: 'v0.dev'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <ClientProviders>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <CookieConsent />
        </ClientProviders>
      </body>
    </html>
  );
}
