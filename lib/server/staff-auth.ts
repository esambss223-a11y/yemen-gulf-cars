import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from '@/lib/supabase-config';

export type StaffRole = 'super_admin' | 'rental_agent' | 'accountant';

export function createServiceClient(): SupabaseClient | null {
  const url = SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function authorizeStaffRequest(request: Request, requireAdmin = false) {
  const url = SUPABASE_URL;
  const anonKey = SUPABASE_PUBLIC_KEY;
  const admin = createServiceClient();
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!url || !anonKey || !admin) {
    return { ok: false as const, status: 503, error: 'Authentication service is not configured' };
  }
  if (!token) {
    return { ok: false as const, status: 401, error: 'Authentication required' };
  }

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) {
    return { ok: false as const, status: 401, error: 'Authentication required' };
  }

  // Authorization is based only on the authenticated UUID and database row.
  const { data: staff, error: staffError } = await admin
    .from('staff')
    .select('id, name, username, role, phone, active')
    .eq('id', user.id)
    .maybeSingle();

  if (staffError) {
    return { ok: false as const, status: 503, error: 'Could not verify staff permissions' };
  }
  if (!staff || !staff.active) {
    return { ok: false as const, status: 403, error: 'Active staff account required' };
  }
  if (requireAdmin && staff.role !== 'super_admin') {
    return { ok: false as const, status: 403, error: 'Administrator access required' };
  }

  return { ok: true as const, admin, user, staff };
}
