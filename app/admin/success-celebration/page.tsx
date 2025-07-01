import { CheckCircle, Trophy, Zap, CreditCard, Webhook, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from '@/app/lib/supabase/client'; // Usa el cliente de navegador
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Usa useRouter para redirección en cliente

export default function SuccessCelebration() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // Hook para redirección

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // 1. Verificar sesión activa
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("Redirigiendo a login...");
          router.push("/auth/login"); // Redirección en cliente
          return;
        }

        // 2. Obtener datos del perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', session.user.id)
          .single();

        // 3. Manejar datos del usuario
        if (profile) {
          setUser({
            name: profile.full_name || session.user.email,
            email: profile.email || session.user.email
          });
        } else {
          setUser({
            name: session.user.email,
            email: session.user.email
          });
        }
        
      } catch (error) {
        console.error("Error al obtener usuario:", error);
      } finally {
        setIsLoading(false);
      }
    };

  
