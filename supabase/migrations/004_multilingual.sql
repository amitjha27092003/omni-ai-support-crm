-- ═══════════════════════════════════════════════════════════════
-- Migration 004: Global Multilingual Support Schema Upgrade
-- ═══════════════════════════════════════════════════════════════
-- Adds universal language detection, ISO tagging, internal English translation
-- for operations teams, and target response language configurations.

ALTER TABLE operational_tickets 
ADD COLUMN IF NOT EXISTS detected_language text,
ADD COLUMN IF NOT EXISTS detected_language_iso text,
ADD COLUMN IF NOT EXISTS english_translation text,
ADD COLUMN IF NOT EXISTS target_response_language text;

-- Performance indexes for language telemetry & analytics filtering
CREATE INDEX IF NOT EXISTS idx_tickets_detected_lang ON operational_tickets(detected_language);
CREATE INDEX IF NOT EXISTS idx_tickets_detected_iso ON operational_tickets(detected_language_iso);

-- Verify columns were added:
COMMENT ON COLUMN operational_tickets.detected_language IS 'Human-readable name of inbound language detected by Gemini 2.5 (e.g., Hindi, Hinglish, Spanish, Arabic)';
COMMENT ON COLUMN operational_tickets.detected_language_iso IS 'Standard ISO code for detected language (e.g., hi, hi-Latn, es, ar, ja)';
COMMENT ON COLUMN operational_tickets.english_translation IS 'Concise English translation of non-English customer transmission for Ops review';
COMMENT ON COLUMN operational_tickets.target_response_language IS 'Language requested for outbound dispatch (default: auto)';
