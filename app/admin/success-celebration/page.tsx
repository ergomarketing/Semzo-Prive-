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
    const supabase = createClient();
    
    // 1. Suscribirse a cambios de estado de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await handleUserData(session.user);
        } else {
          router.push("/auth/login");
        }
      }
    );

    // 2. Verificar sesión inicial
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleUserData(session.user);
      } else {
        router.push("/auth/login");
      }
    };

    // Función para manejar datos del usuario (reutilizable)
    const handleUserData = async (userData: any) => {
      try {
        setIsLoading(true);
        
        // Intentar obtener datos de perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', userData.id)
          .maybeSingle();

        // Crear perfil si no existe
        if (!profile) {
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: userData.id,
              full_name: userData.email,
              email: userData.email
            });
          
          if (error) console.error("Error creando perfil:", error);
        }

        // Actualizar estado con datos del usuario
        setUser({
          name: profile?.full_name || userData.email,
          email: profile?.email || userData.email
        });
        
      } catch (error) {
        console.error("Error manejando datos de usuario:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSession();

    // Limpiar suscripción al desmontar
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  // ... [resto del código UI sin cambios] ...
}
