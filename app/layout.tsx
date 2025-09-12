import './globals.css';
import { ClientProviders } from './providers';

export const metadata = {
  title: 'App',
  description: 'App'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
