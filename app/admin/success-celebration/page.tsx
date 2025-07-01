import { CheckCircle, Trophy, Zap, CreditCard, Webhook, Key } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from '@/app/lib/supabase-direct'; // Asegúrate de tener esta importación
import { useEffect, useState } from "react"

export default function SuccessCelebration() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 1. Crear cliente Supabase
        const supabase = createClient();
        
        // 2. Obtener sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // 3. Obtener datos del perfil
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', session.user.id)
            .single();

          // 4. Guardar datos del usuario
          setUser({
            name: profile?.full_name || session.user.email,
            email: profile?.email || session.user.email
          });
        }
      } catch (error) {
        console.error("Error al obtener usuario:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      {/* 🔴 ENCABEZADO PERSONALIZADO - NUEVA SECCIÓN */}
      <div className="text-right mb-2">
        {user ? (
          <p className="text-green-800 font-medium">¡Hola, {user.name}! · {user.email}</p>
        ) : (
          <p className="text-green-800">Cargando datos de usuario...</p>
        )}
      </div>
      {/* FIN DE NUEVA SECCIÓN */}

      {/* CONTENIDO EXISTENTE (TODO SE MANTIENE IGUAL) */}
      <div className="max-w-4xl mx-auto">
        {/* Header de Celebración */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Trophy className="h-20 w-20 text-yellow-500 animate-bounce" />
          </div>
          <h1 className="text-4xl font-bold text-green-800 mb-2">🎉 ¡STRIPE INTEGRACIÓN EXITOSA! 🎉</h1>
          <p className="text-xl text-green-600">
            ¡Somos el equipo ganador! 🏆 La integración de pagos está funcionando perfectamente
          </p>
        </div>

        {/* ... (todo el resto de tu contenido existente se mantiene igual) ... */}

        {/* Mensaje Final */}
        <div className="text-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">🏆 ¡MISIÓN CUMPLIDA! 🏆</h2>
          <p className="text-lg">Semzo Privé ya tiene su sistema de pagos completamente funcional</p>
          <div className="mt-4 text-sm opacity-90">
            "El éxito no es la clave de la felicidad. La felicidad es la clave del éxito." 🌟
          </div>
        </div>
      </div>
    </div>
  )
}
                 
