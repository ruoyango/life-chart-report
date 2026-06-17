import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public Supabase config — these are embedded into the client bundle at build
// time. The anon key is meant to be public (it's protected by Row-Level
// Security), unlike a service-role key or the Anthropic key, which must never
// be exposed here.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True once both env vars are present. When false, the app still builds and
// runs — the login modal just reports that auth isn't configured yet.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;
