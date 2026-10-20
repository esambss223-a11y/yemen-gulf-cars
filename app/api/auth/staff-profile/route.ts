import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olpjfipferziqtzrbbbt.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  if (!SERVICE_KEY) {
    return NextResponse.json({ error: 'Service key not configured' }, { status: 503 });
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/staff?id=eq.${encodeURIComponent(userId)}&select=*`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json({ staff: rows[0] });
      }
    }

    return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch staff profile' }, { status: 500 });
  }
}
