import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// DEV: Hardcoded user ID used for all Supabase queries while auth gating is
// disabled. Replace with `(await supabase.auth.getUser()).data.user?.id` (or
// read from the auth context) when re-enabling auth.
export const DEV_USER_ID = '0c6be438-2d86-4ecc-bfa4-4ecd6d783875';
