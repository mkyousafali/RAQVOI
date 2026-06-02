import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// These are NOT hardcoded - they come from .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

// Create Supabase client
// This client uses the anon key which respects RLS policies
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
