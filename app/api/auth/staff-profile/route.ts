import { NextRequest, NextResponse } from 'next/server';
import { authorizeStaffRequest } from '@/lib/server/staff-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeStaffRequest(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    return NextResponse.json({ staff: auth.staff });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch staff profile' }, { status: 500 });
  }
}
