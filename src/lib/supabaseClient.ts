import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bpgrpmdjpdydmlonbeag.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZ3JwbWRqcGR5ZG1sb25iZWFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDQxMzUsImV4cCI6MjEwNTIyMDEzNX0.mIGYvcVHeCmhNGvBfbm5imlih-r5oWkBdBFHgZ-wX0A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);