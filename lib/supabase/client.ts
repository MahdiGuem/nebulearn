import { createClient } from "@supabase/supabase-js";

// Get environment variables with runtime check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for public/browser operations
export const supabase = createClient(
  supabaseUrl || "http://localhost",
  supabaseAnonKey || "dummy-key"
);

// Admin client for server-side operations (uploads, deletions)
// Uses service role key for elevated permissions
export const supabaseAdmin = createClient(
  supabaseUrl || "http://localhost",
  supabaseServiceKey || "dummy-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Runtime validation helper
export function validateSupabaseConfig() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file"
    );
  }
}
