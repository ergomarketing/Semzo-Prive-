export default function AnalyticsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-serif mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-serif mb-4">Facebook Pixel</h2>
          <p className="mb-4">Para ver las estadísticas completas de Facebook Pixel:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Accede a tu{" "}
              <a
                href="https://business.facebook.com/events_manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Facebook Business Manager
              </a>
            </li>
            <li>Ve a Administrador de eventos</li>
            <li>Selecciona tu pixel</li>
            <li>Explora las estadísticas y eventos</li>
          </ol>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-serif mb-4">Google Analytics</h2>
          <p className="mb-4">Para ver las estadísticas completas de Google Analytics:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Accede a{" "}
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Google Analytics
              </a>
            </li>
            <li>Selecciona tu propiedad</li>
            <li>Explora los informes en el menú lateral</li>
            <li>Revisa conversiones, adquisición y comportamiento</li>
          </ol>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-serif mb-4">Eventos Configurados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facebook
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Google
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Registro</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">CompleteRegistration</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">sign_up</td>
                <td className="px-6 py-4 text-sm text-gray-500">Cuando un usuario completa el registro</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Inicio Checkout</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">InitiateCheckout</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">begin_checkout</td>
                <td className="px-6 py-4 text-sm text-gray-500">Cuando un usuario inicia el proceso de pago</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Compra</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Purchase</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">purchase</td>
                <td className="px-6 py-4 text-sm text-gray-500">Cuando un usuario completa una compra</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Ver Bolso</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ViewContent</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">view_item</td>
                <td className="px-6 py-4 text-sm text-gray-500">Cuando un usuario ve un bolso específico</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Añadir a Wishlist</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">AddToWishlist</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">add_to_wishlist</td>
                <td className="px-6 py-4 text-sm text-gray-500">Cuando un usuario añade un bolso a su wishlist</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Compartir Referido</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Share</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">share</td>
                <td className="px-6 py-4 text-sm text-gray-500">Cuando un usuario comparte su código de referido</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-serif mb-4">Guía de Implementación</h2>
        <p className="mb-4">Para completar la configuración de los pixels:</p>
        <ol className="list-decimal pl-5 space-y-3">
          <li>
            <strong>Facebook Pixel:</strong> Crea un pixel en tu{" "}
            <a
              href="https://business.facebook.com/events_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              Facebook Business Manager
            </a>{" "}
            y añade el ID en las variables de entorno como{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_FACEBOOK_PIXEL_ID</code>
          </li>
          <li>
            <strong>Google Analytics:</strong> Crea una propiedad en{" "}
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              Google Analytics
            </a>{" "}
            y añade el ID en las variables de entorno como{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_GOOGLE_ANALYTICS_ID</code>
          </li>
          <li>
            <strong>Google Ads:</strong> Conecta tu cuenta de Google Ads con Google Analytics para seguimiento de
            conversiones
          </li>
          <li>
            <strong>Eventos personalizados:</strong> Usa las funciones de{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">trackEvents</code> en los componentes relevantes
          </li>
        </ol>
      </div>
    </div>
  )
}
