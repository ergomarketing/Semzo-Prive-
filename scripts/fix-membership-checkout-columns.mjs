import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  console.log("Running migration: fix-membership-checkout-columns")

  const { error: e1 } = await supabase.rpc("exec_sql", {
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'membership_intents'
          AND column_name = 'stripe_checkout_session_id'
        ) THEN
          ALTER TABLE membership_intents ADD COLUMN stripe_checkout_session_id TEXT;
          CREATE INDEX IF NOT EXISTS idx_membership_intents_checkout_session
            ON membership_intents(stripe_checkout_session_id);
        END IF;
      END $$;
    `,
  })
  if (e1) console.error("membership_intents column:", e1.message)
  else console.log("OK: stripe_checkout_session_id column ensured")

  const { error: e2 } = await supabase.rpc("exec_sql", {
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'identity_verifications'
          AND column_name = 'stripe_verification_id'
        ) THEN
          ALTER TABLE identity_verifications ADD COLUMN stripe_verification_id TEXT UNIQUE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'identity_verifications'
          AND column_name = 'intent_id'
        ) THEN
          ALTER TABLE identity_verifications ADD COLUMN intent_id UUID REFERENCES membership_intents(id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'identity_verifications'
          AND column_name = 'verified_at'
        ) THEN
          ALTER TABLE identity_verifications ADD COLUMN verified_at TIMESTAMPTZ;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'identity_verifications'
          AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE identity_verifications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
      END $$;
    `,
  })
  if (e2) console.error("identity_verifications columns:", e2.message)
  else console.log("OK: identity_verifications columns ensured")

  console.log("Migration complete.")
}

run().catch(console.error)
