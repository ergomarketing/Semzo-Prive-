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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error de sesión:", sessionError);
          redirect("/auth/login");
          return;
        }
        
        if (!session) {
          console.log("No hay sesión activa");
          redirect("/auth/login");
          return;
        }

        // 2. Obtener usuario autenticado
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !authUser) {
          console.error("Usuario no autenticado:", userError?.message);
          redirect("/auth/login");
          return;
        }

        // 3. Obtener datos del perfil
        const { data: profile, error: profileError } = await supabase
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
          
          // Crear perfil automáticamente si falta
          await supabase.from('profiles').insert({
            id: authUser.id,
            full_name: authUser.email,
            email: authUser.email
          });
        }
        
      } catch (error) {
        console.error("Error crítico:", error);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Usuario no autenticado</h2>
          <p className="text-gray-700 mb-6">
            Por favor inicia sesión para acceder a esta página
          </p>
          <button 
            onClick={() => redirect("/auth/login")}
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
          <h1 className="text-4xl font-bold text-green-800 mb-2">🎉 ¡BIENVENIDO/A A SEMZO PRIVÉ! 🎉</h1>
          <p className="text-xl text-green-600">
            {user.name}, tu experiencia de lujo está lista
          </p>
        </div>

        {/* ... (resto del contenido idéntico a tu versión anterior) ... */}
      </div>
    </div>
  );
}
