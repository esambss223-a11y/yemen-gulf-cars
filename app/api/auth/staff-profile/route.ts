import { NextRequest, NextResponse } from 'next/server';
import { authorizeStaffRequest } from '@/lib/server/staff-auth';

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  try {
    const auth = await authorizeStaffRequest(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ staff: auth.staff });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch staff profile' }, { status: 500 });
  }
}
