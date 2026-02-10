-- Create email_logs table to track all outgoing emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Email details
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'contact', 'newsletter_subscription', 'reservation_created', 'reservation_cancelled', 'user_registered', etc.
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  resend_id TEXT, -- ID from Resend API
  metadata JSONB, -- Additional data (priority, ticket_id, reservation_id, etc.)
  
  -- Indexes
  created_at_idx TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read email logs
CREATE POLICY "Only admins can read email logs"
  ON email_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
