import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bpgrpmdjpydmlonbeag.supabase.co";
const supabaseKey = "sb_publishable_p4lElegw5SmpEySwxV6rag_0gkYW9s0";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});