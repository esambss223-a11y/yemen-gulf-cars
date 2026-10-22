// These are public client credentials and already ship in the browser bundle.
// Keep server routes and the browser client pointed at the same Supabase project
// when a hosting provider uses different environment variable names.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://olpjfipferziqtzrbbbt.supabase.co';

export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ttzLa9vmYT9Ym0eGckMY_w_yDEjmXZb';
