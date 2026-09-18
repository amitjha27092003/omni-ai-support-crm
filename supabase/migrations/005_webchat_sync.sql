-- ═══════════════════════════════════════════════════════════════
-- Migration 005: WebChat Realtime Bidirectional Synchronization
-- ═══════════════════════════════════════════════════════════════
-- Enables Supabase Realtime broadcast for operational_tickets and
-- creates the ticket_messages table for streaming conversation threads
-- between public WebChat visitors and admin CRM operators.

-- 1. Ensure operational_tickets is in supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE operational_tickets;

-- 2. Allow anonymous insert for WebChat tickets
DROP POLICY IF EXISTS "anon_insert_webchat" ON operational_tickets;
CREATE POLICY "anon_insert_webchat" ON operational_tickets
  FOR INSERT TO anon WITH CHECK (channel = 'WebChat');

-- 3. Create ticket_messages table for conversation stream
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES operational_tickets(id) ON DELETE CASCADE,
  sender text CHECK (sender IN ('customer','agent','ai')),
  content text NOT NULL,
  language text,
  created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS on ticket_messages
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- 5. Anonymous read policy on messages for live customer chat
DROP POLICY IF EXISTS "anon_read_messages" ON ticket_messages;
CREATE POLICY "anon_read_messages" ON ticket_messages
  FOR SELECT TO anon USING (true);

-- 6. Anonymous insert policy for customer messages
DROP POLICY IF EXISTS "anon_insert_customer_messages" ON ticket_messages;
CREATE POLICY "anon_insert_customer_messages" ON ticket_messages
  FOR INSERT TO anon WITH CHECK (sender = 'customer');

-- 7. Add ticket_messages to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;

-- Indexes for lightning-fast message queries & realtime filtering
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);
