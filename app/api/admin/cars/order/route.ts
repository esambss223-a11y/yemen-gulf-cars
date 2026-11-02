import { authorizeStaffRequest } from '@/lib/server/staff-auth';

export async function POST(request: Request) {
  const auth = await authorizeStaffRequest(request, true);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'طلب غير صالح.' }, { status: 400 }); }
  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length > 2000 || ids.some(id => typeof id !== 'string' || !id || id.length > 200) || new Set(ids).size !== ids.length) return Response.json({ error: 'ترتيب غير صالح.' }, { status: 400 });
  const { error } = await auth.admin.rpc('fleet_save_car_order', { p_ids: ids });
  if (error) {
    const missing = ['PGRST202','42703'].includes(error.code);
    return Response.json({ error: missing ? 'شغّل ملف 20261031_car_display_order.sql في Supabase لتفعيل حفظ الترتيب.' : 'لم يُحفظ الترتيب. قد تكون قائمة السيارات تغيرت؛ حدّث الصفحة وأعد المحاولة.' }, { status: missing ? 503 : 409 });
  }
  return Response.json({ saved: true });
}
