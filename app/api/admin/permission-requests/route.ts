import { authorizeStaffRequest } from '@/lib/server/staff-auth';

const ROLES = new Set(['super_admin', 'rental_agent', 'accountant']);

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const auth = await authorizeStaffRequest(request);
  if (!auth.ok) return Response.json({ code: 'NOT_AUTHORIZED', error: auth.error }, { status: auth.status });

  const body = await readBody(request);
  const requestedRole = typeof body?.requestedRole === 'string' ? body.requestedRole : '';
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  if (!ROLES.has(requestedRole) || reason.length < 5 || reason.length > 300) {
    return Response.json({ code: 'INVALID_REQUEST', error: 'اختر الصلاحية واكتب سببًا من 5 إلى 300 حرف.' }, { status: 400 });
  }
  if (requestedRole === auth.staff.role) {
    return Response.json({ code: 'ROLE_ALREADY_ASSIGNED', error: 'هذه الصلاحية موجودة في حسابك بالفعل.' }, { status: 409 });
  }

  const { data, error } = await auth.admin.from('permission_requests').insert({
    staff_id: auth.staff.id,
    requested_role: requestedRole,
    reason,
  }).select('id, requested_role, status, created_at').single();

  if (error?.code === '23505') {
    return Response.json({ code: 'REQUEST_ALREADY_PENDING', error: 'لديك طلب صلاحية قيد المراجعة بالفعل.' }, { status: 409 });
  }
  if (error || !data) {
    console.error('[permission-request:CREATE_FAILED]', error?.code || 'UNKNOWN');
    return Response.json({ code: 'REQUEST_CREATE_FAILED', error: 'تعذر إرسال طلب الصلاحية.' }, { status: 500 });
  }

  return Response.json({ request: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await authorizeStaffRequest(request, true);
  if (!auth.ok) return Response.json({ code: 'NOT_AUTHORIZED', error: auth.error }, { status: auth.status });

  const body = await readBody(request);
  const requestId = typeof body?.id === 'string' ? body.id : '';
  const decision = body?.decision;
  if (!requestId || (decision !== 'approved' && decision !== 'rejected')) {
    return Response.json({ code: 'INVALID_REVIEW', error: 'بيانات مراجعة الطلب غير صالحة.' }, { status: 400 });
  }

  const { data, error } = await auth.admin.rpc('review_permission_request', {
    p_request_id: requestId,
    p_decision: decision,
    p_reviewer_id: auth.staff.id,
  });
  if (error) {
    if (error.message.includes('REQUEST_NOT_PENDING')) {
      return Response.json({ code: 'REQUEST_NOT_PENDING', error: 'تمت مراجعة هذا الطلب مسبقًا.' }, { status: 409 });
    }
    console.error('[permission-request:REVIEW_FAILED]', error.code || 'UNKNOWN');
    return Response.json({ code: 'REQUEST_REVIEW_FAILED', error: 'تعذرت مراجعة الطلب. تحقق من تحديث قاعدة البيانات.' }, { status: 503 });
  }

  return Response.json({ request: data });
}
