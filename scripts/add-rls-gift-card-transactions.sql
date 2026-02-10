-- Enable RLS on gift_card_transactions
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
ON gift_card_transactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON gift_card_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role full access"
ON gift_card_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
