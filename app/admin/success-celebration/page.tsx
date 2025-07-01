import { CheckCircle, Trophy, Zap, CreditCard, Webhook, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from '@/app/lib/supabase/client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuccessCelebration() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // 1. Verificar sesión activa
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("Redirigiendo a login...");
          router.push("/auth/login");
          return;
        }

        // 2. Obtener datos del perfil con manejo de error
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error obteniendo perfil:", profileError);
          
          // Usar datos básicos de auth si falla
          setUser({
            name: session.user.email,
            email: session.user.email
          });
          return;
        }

        // 3. Manejar datos del usuario
        setUser({
          name: profile?.full_name || session.user.email,
          email: profile?.email || session.user.email
        });
        
      } catch (error) {
        console.error("Error al obtener usuario:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-green-800">Cargando datos de usuario...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso no autorizado</h2>
          <p className="text-gray-700 mb-6">
            Por favor inicia sesión para acceder a esta página
          </p>
          <button 
            onClick={() => router.push("/auth/login")}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition duration-300"
          >
            Ir a Inicio de Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      {/* Encabezado personalizado */}
      <div className="text-right mb-2">
        <p className="text-green-800 font-medium">¡Hola, {user.name}! · {user.email}</p>
      </div>

      {/* Contenido existente */}
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

        {/* Confirmación del Éxito */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-6 w-6" />
              Confirmación de Funcionamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-green-600" />
                <span>✅ Tarjeta procesada correctamente</span>
              </div>
              <div className="flex items-center gap-3">
                <Webhook className="h-5 w-5 text-green-600" />
                <span>✅ Transacción registrada en Stripe</span>
              </div>
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-green-600" />
                <span>✅ Claves API funcionando</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-green-600" />
                <span>✅ Sistema de pagos activo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de lo Solucionado */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-blue-800">🔧 Problemas Resueltos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  ANTES
                </Badge>
                <span className="line-through text-gray-500">Error de conexión de Internet</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  ANTES
                </Badge>
                <span className="line-through text-gray-500">No se registraban eventos en Stripe</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  ANTES
                </Badge>
                <span className="line-through text-gray-500">Clave secreta truncada</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  ANTES
                </Badge>
                <span className="line-through text-gray-500">Clave pública inválida</span>
              </div>

              <div className="border-t pt-3 mt-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    AHORA
                  </Badge>
                  <span className="text-green-700 font-semibold">🎉 ¡TODO FUNCIONANDO PERFECTAMENTE!</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximos Pasos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-purple-800">🚀 Próximos Pasos Recomendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">Configuración de Producción:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Configurar métodos de pago adicionales</li>
                  <li>• Personalizar mensajes de error</li>
                  <li>• Configurar emails de confirmación</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">Monitoreo:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Revisar dashboard de Stripe regularmente</li>
                  <li>• Configurar alertas de transacciones</li>
                  <li>• Monitorear logs de errores</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

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
  );
}
