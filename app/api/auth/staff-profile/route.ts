import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olpjfipferziqtzrbbbt.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bearerToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!anonKey || !serviceKey || !bearerToken) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(bearerToken);
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: staff, error } = await adminClient
      .from('staff')
      .select('id, name, username, role, phone, active')
      .eq('id', userId)
      .maybeSingle();

    if (error || !staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}
