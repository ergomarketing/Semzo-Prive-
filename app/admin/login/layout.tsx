/**
 * Layout para la página de login del admin
 * Este layout NO aplica protección, permitiendo que los usuarios no autenticados vean el formulario de login
 */

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
