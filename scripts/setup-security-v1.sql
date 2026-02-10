-- CONFIGURAR SEGURIDAD RLS

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bags ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "profiles_own" ON public.profiles 
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "bags_public" ON public.bags 
  FOR SELECT USING (true);
