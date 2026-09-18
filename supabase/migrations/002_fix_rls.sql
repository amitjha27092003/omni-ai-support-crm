-- =====================================================
-- Migration: 002_fix_rls.sql
-- Project: OmniAI Support CRM
-- Purpose: Enable RLS, grant SELECT to anon/authenticated,
--          and ensure table is in supabase_realtime publication.
-- =====================================================

-- 1. Enable Row Level Security
ALTER TABLE public.operational_tickets ENABLE ROW LEVEL SECURITY;

-- 2. Drop conflicting old policies if present
DROP POLICY IF EXISTS "anon_read_tickets" ON public.operational_tickets;
DROP POLICY IF EXISTS "anon_insert_tickets" ON public.operational_tickets;
DROP POLICY IF EXISTS "allow_anon_read" ON public.operational_tickets;
DROP POLICY IF EXISTS "public_read_operational_tickets" ON public.operational_tickets;

-- 3. SELECT policy for anon & authenticated (dashboard reading)
CREATE POLICY "anon_read_tickets"
  ON public.operational_tickets
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. Ensure realtime publication includes operational_tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'operational_tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_tickets;
  END IF;
END $$;
