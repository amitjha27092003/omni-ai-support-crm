import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bpgrpmdjpydmlonbeag.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZ3JwbWRqcHlkbWxvbmJlYWciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1MjYxMDk2MywiZXhwIjoyMDY4MTg2OTY0fQ.mIGYvcVHeCmhNGvBfbm5im1ih-r5oWkBdBFHgZ-wX0A';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
  },
});