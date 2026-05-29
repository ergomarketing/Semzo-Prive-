import { createClient } from '@supabase/supabase-js'
const url = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const s = createClient(url, key, { auth: { persistSession: false } })

const uid = 'ee55d185-ba86-40b1-a93f-c3bb9b7996a0'
const gcId = 'ba69ca17-d0a4-4a40-be8c-36b9d29fe917'
const paidPassId = '7f7e30c6-1d07-4d26-a234-820d079918ad' // usado en reserva activa
const dupPassId = '0bd80108-b7cd-4266-9d22-4082ee9b1e76'  // duplicado available

// 1. Borrar pase duplicado (solo si sigue available y sin reserva)
const { data: del, error: eDel } = await s
  .from('bag_passes')
  .delete()
  .eq('id', dupPassId)
  .eq('status', 'available')
  .is('used_for_reservation_id', null)
  .select('id')
console.log('Pase duplicado borrado:', del, eDel?.message)

// 2. Debitar 99€ (9900 cents) de la gift card, con guardia anti-doble
const PRICE = 9900
const { data: upd, error: eUpd } = await s
  .from('gift_cards')
  .update({ amount: 18000 - PRICE, status: 'active', used_by: uid, updated_at: new Date().toISOString() })
  .eq('id', gcId)
  .gte('amount', PRICE)
  .select('id, amount')
console.log('Gift card debitada:', upd, eUpd?.message)

// 3. Registrar transaccion (idempotente: solo si no existe ya para este pase)
const { data: existing } = await s.from('gift_card_transactions').select('id').eq('reference_id', paidPassId).maybeSingle()
if (!existing) {
  const { error: eTx } = await s.from('gift_card_transactions').insert({
    gift_card_id: gcId,
    user_id: uid,
    amount_used: PRICE,
    order_reference: `bag_pass_${paidPassId}`,
    reference_id: paidPassId,
  })
  console.log('Transaccion registrada:', eTx?.message || 'OK')
} else {
  console.log('Transaccion ya existia, skip')
}

// 4. Verificar estado final
const { data: gc } = await s.from('gift_cards').select('amount,status,used_by').eq('id', gcId).single()
const { data: passes } = await s.from('bag_passes').select('id,status,used_for_reservation_id').eq('user_id', uid)
console.log('FINAL gift card:', JSON.stringify(gc))
console.log('FINAL passes:', JSON.stringify(passes))
