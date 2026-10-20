import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://olpjfipferziqtzrbbbt.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_ttzLa9vmYT9Ym0eGckMY_w_yDEjmXZb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase Auth accepts email/password; the dashboard can expose a username or direct email
export function usernameToAuthEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const authDomain = new URL(supabaseUrl).hostname;
  return `${trimmed}@${authDomain}`;
}
