-- PASO 3: Crear el nuevo trigger
-- Ejecuta esto después del paso 2

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

SELECT 'Trigger creado correctamente - El signup ahora funcionará' AS status;
