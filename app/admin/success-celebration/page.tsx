import { CheckCircle, Trophy, Zap, CreditCard, Webhook, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from '@/app/lib/supabase/server';
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";

export default function SuccessCelebration() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // 1. Verificar sesión activa
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("No hay sesión activa");
          redirect("/auth/login");
          return;
        }

        // 2. Obtener usuario autenticado
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          console.error("Usuario no autenticado");
          redirect("/auth/login");
          return;
        }

        // 3. Obtener datos del perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', authUser.id)
          .single();

        // 4. Manejar datos del usuario
        if (profile) {
          setUser({
            name: profile.full_name || authUser.email,
            email: profile.email || authUser.email
          });
        } else {
          // Si no hay perfil, usar datos de autenticación
          setUser({
            name: authUser.email,
            email: authUser.email
          });
        }
        
      } catch (error) {
        console.error("Error al obtener usuario:", error);
        redirect("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      {/* Encabezado personalizado */}
      <div className="text-right mb-2">
        {user ? (
          <p className="text-green-800 font-medium">¡Hola, {user.name}! · {user.email}</p>
        ) : (
          <p className="text-green-800">Usuario no identificado</p>
        )}
      </div>

      {/* Contenido existente - SIN CAMBIOS VISUALES */}
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

        {/* Resto de tu contenido existente SIN MODIFICAR */}
        {/* ... */}
      </div>
    </div>
  );
}
