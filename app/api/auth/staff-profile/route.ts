import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olpjfipferziqtzrbbbt.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return NextResponse.json({ error: 'Service key not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/staff?id=eq.${encodeURIComponent(userId)}&select=*`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: res.status });
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({ staff: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
