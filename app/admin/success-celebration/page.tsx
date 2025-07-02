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
    
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // 1. Obtener usuario directamente
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !authUser) {
          console.log("No hay usuario autenticado");
          router.push("/auth/login");
          return;
        }

        // 2. Obtener o crear perfil
        let userProfile = null;
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', authUser.id)
          .maybeSingle();
        
        if (profileError) {
          console.error("Error obteniendo perfil:", profileError);
        }
        
        // 3. Si no hay perfil, crearlo
        if (!profile) {
          console.log("Creando perfil automáticamente...");
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.email
            })
            .select()
            .single();
            
          userProfile = newProfile;
        } else {
          userProfile = profile;
        }
        
        // 4. Guardar datos del usuario
        setUser({
          name: userProfile?.full_name || authUser.email,
          email: userProfile?.email || authUser.email
        });
        
      } catch (error) {
        console.error("Error crítico:", error);
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    
    // 5. Suscribirse a cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          router.push("/auth/login");
        }
      }
    );
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  // ... [El resto de tu UI permanece igual] ...
}
