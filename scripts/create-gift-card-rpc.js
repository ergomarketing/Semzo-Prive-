import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const sql = `
CREATE OR REPLACE FUNCTION public.atomic_gift_card_consume(
  p_gift_card_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows_updated INTEGER;
BEGIN
  UPDATE public.gift_cards
  SET
    amount = GREATEST(0, amount - p_amount),
    status = CASE WHEN (amount - p_amount) <= 0 THEN 'used' ELSE 'active' END,
    updated_at = NOW()
  WHERE id = p_gift_card_id
    AND status = 'active'
    AND amount >= p_amount;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  RETURN v_rows_updated > 0;
END;
$$;
`

const { error } = await supabase.rpc("query", { query: sql }).catch(() => ({ error: null }))

// Supabase JS no permite DDL via rpc sin una función existente.
// Usamos la Management API si está disponible, o informamos el SQL a ejecutar manualmente.
console.log("Ejecuta este SQL en Supabase SQL Editor:")
console.log(sql)
console.log("---")
console.log("URL del proyecto:", process.env.NEXT_PUBLIC_SUPABASE_URL)
