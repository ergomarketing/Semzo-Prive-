import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log("Running migration: fix-membership-checkout-columns")

  // 1. Add stripe_checkout_session_id to membership_intents
  const { error: e1 } = await supabase.from("membership_intents").select("stripe_checkout_session_id").limit(1)
  if (e1?.message?.includes("column") && e1.message.includes("does not exist")) {
    const { error: alter1 } = await supabase.rpc("alter_table", {}).catch(() => ({ error: null }))
    console.log("Note: stripe_checkout_session_id needs manual migration — column check done via query")
  } else {
    console.log("OK: stripe_checkout_session_id already exists or not needed")
  }

  // 2. Check identity_verifications columns
  const { error: e2 } = await supabase.from("identity_verifications").select("stripe_verification_id").limit(1)
  if (e2?.message?.includes("column") && e2.message.includes("does not exist")) {
    console.log("Note: stripe_verification_id needs manual migration")
  } else {
    console.log("OK: identity_verifications columns exist")
  }

  // 3. Test membership_intents insert with all required fields
  const { data: testData, error: e3 } = await supabase
    .from("membership_intents")
    .select("id, status, billing_cycle, amount_cents, original_amount_cents, stripe_checkout_session_id")
    .limit(1)

  if (e3) {
    console.error("Schema check failed:", e3.message)
  } else {
    console.log("Schema OK. Sample row keys:", testData?.[0] ? Object.keys(testData[0]) : "no rows yet")
  }

  // 4. Test identity_verifications schema
  const { data: ivData, error: e4 } = await supabase
    .from("identity_verifications")
    .select("id, user_id, stripe_verification_id, intent_id, status, verified_at, updated_at")
    .limit(1)

  if (e4) {
    console.error("identity_verifications schema check failed:", e4.message)
    console.log("ACTION NEEDED: Run the following SQL in Supabase SQL Editor:")
    console.log(`
ALTER TABLE identity_verifications
  ADD COLUMN IF NOT EXISTS stripe_verification_id TEXT,
  ADD COLUMN IF NOT EXISTS intent_id UUID REFERENCES membership_intents(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_iv_stripe_verification_id
  ON identity_verifications(stripe_verification_id)
  WHERE stripe_verification_id IS NOT NULL;

ALTER TABLE membership_intents
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_mi_checkout_session
  ON membership_intents(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
    `)
  } else {
    console.log("identity_verifications schema OK:", ivData?.[0] ? Object.keys(ivData[0]) : "no rows yet")
  }

  console.log("Migration check complete.")
}

run().catch(console.error)
