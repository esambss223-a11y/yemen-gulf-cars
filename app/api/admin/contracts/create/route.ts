import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { authorizeStaffRequest } from '@/lib/server/staff-auth';
import { validateContractDetails } from '@/lib/rental-contract';
import { mapCloudCarRow } from '@/lib/car-mapping';
import { validateRentalDuration } from '@/lib/booking-dates';
import { rentalQuote } from '@/lib/car-pricing';
export const runtime = 'nodejs';
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const columns = ['id', 'booking_number', 'car_id', 'car_name', 'car_plate', 'customer', 'start_date', 'start_time', 'end_date', 'end_time', 'days_count', 'daily_rate_egp', 'total_rent_egp', 'discount_code', 'discount_amount_egp', 'final_total_egp', 'security_deposit_egp', 'deposit_status', 'start_km', 'status', 'notes'] as const;
export async function POST(request: Request) {
  const auth = await authorizeStaffRequest(request);
  if (!auth.ok) return reply({ error: auth.error }, auth.status);
  if (!['super_admin', 'rental_agent'].includes(auth.staff.role)) return reply({ error: 'إنشاء عقد متاح للمدير وموظف التأجير.' }, 403);
  let body;
  try {
    if (!request.body || Number(request.headers.get('content-length')) > 65536) throw new Error();
    const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 65536) { await reader.cancel(); throw new Error(); } chunks.push(value); } }
    finally { reader.releaseLock(); }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return reply({ error: 'بيانات العقد غير صالحة أو أكبر من المسموح.' }, 400); }
  const input = body?.booking;
  if (!input || typeof input !== 'object' || Array.isArray(input)) return reply({ error: 'بيانات الحجز غير صالحة.' }, 400);
  const row: Record<string, unknown> = Object.fromEntries(columns.filter(key => input[key] !== undefined).map(key => [key, input[key]]));
  for (const key of ['id', 'booking_number', 'car_id', 'car_name', 'car_plate', 'start_date', 'end_date']) if (typeof row[key] !== 'string' || !row[key] || (row[key] as string).length > 240) return reply({ error: 'أكمل بيانات العميل والسيارة والمواعيد.' }, 400);
  if (!/^[\w-]{1,100}$/.test(String(row.id)) || !/^[\w-]{1,100}$/.test(String(row.car_id))) return reply({ error: 'معرّف الحجز أو السيارة غير صالح.' }, 400);
  for (const key of ['days_count', 'daily_rate_egp', 'total_rent_egp', 'discount_amount_egp', 'final_total_egp', 'security_deposit_egp', 'start_km']) if (typeof row[key] !== 'number' || !Number.isFinite(row[key]) || Number(row[key]) < 0) return reply({ error: 'راجع مبالغ العقد وقراءة العداد.' }, 400);
  const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime()) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(row.start_date) || !validDate(row.end_date) || String(row.end_date) < String(row.start_date) || !Number.isInteger(row.days_count) || Number(row.days_count) < 1 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(row.start_time)) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(row.end_time))) return reply({ error: 'راجع تاريخ ووقت الاستلام والإرجاع.' }, 400);
  const customer = row.customer;
  if (!customer || typeof customer !== 'object' || Array.isArray(customer) || ['id', 'fullName', 'phone', 'nationalId', 'licenseNumber'].some(key => typeof (customer as Record<string, unknown>)[key] !== 'string' || !(customer as Record<string, string>)[key].trim() || (customer as Record<string, string>)[key].length > 240)) return reply({ error: 'أكمل بيانات العميل والهوية والرخصة.' }, 400);
  if (row.status !== 'active' || row.deposit_status !== 'held' || (row.notes !== undefined && (typeof row.notes !== 'string' || row.notes.length > 5000))) return reply({ error: 'بيانات التسليم غير صالحة.' }, 400);
  const rent = Number(row.total_rent_egp), discount = Number(row.discount_amount_egp);
  if (Math.abs(Math.max(0, rent - discount) - Number(row.final_total_egp)) > 0.01) return reply({ error: 'صافي الإيجار لا يطابق المبالغ والخصم.' }, 400);
  const { data: car, error: carError } = await auth.admin.from('cars').select('*').eq('id', row.car_id).maybeSingle();
  if (carError) return reply({ error: 'تعذر التحقق من بيانات السيارة. أعد المحاولة.' }, 503);
  if (!car) return reply({ error: 'السيارة غير موجودة. حدّث القائمة.' }, 404);
  try {
    const savedCar = mapCloudCarRow(car);
    const days = validateRentalDuration(String(row.start_date), String(row.end_date), savedCar.minRentalDays);
    if (days !== row.days_count) return reply({ error: 'مدة العقد لا تطابق تواريخ الاستلام والإرجاع.' }, 400);
    const quote = rentalQuote(savedCar, days);
    if (Math.abs(quote.totalEGP - Number(row.total_rent_egp)) > 0.01 || Math.abs(quote.dailyRateEGP - Number(row.daily_rate_egp)) > 0.01) return reply({ error: 'تغيّرت أسعار السيارة أو لا يطابق المبلغ فئة المدة. أعد فتح نموذج الحجز لمراجعة السعر.' }, 409);
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'راجع مدة الإيجار.' }, 400); }
  let details;
  try { details = validateContractDetails(body.details, Number(row.final_total_egp)); }
  catch (error) { return reply({ error: error instanceof Error ? error.message : 'راجع بيانات العقد.' }, 400); }
  row.staff_id = auth.staff.id; row.staff_name = auth.staff.name;
  const record = { revision: randomUUID(), details, attachments: [], updatedAt: new Date().toISOString(), updatedBy: auth.staff.name };
  const { data, error } = await auth.admin.from('bookings').insert({ ...row, contract_record: record }).select('contract_record').single();
  if (error) {
    if (['42703', 'PGRST204'].includes(error.code)) return reply({ error: 'يلزم تثبيت تحديث حقل العقد في قاعدة البيانات. لم يُحفظ الحجز.' }, 503);
    if (error.code === '23505') {
      // A retry after a lost response must not create another booking or replace a document.
      const existing = await auth.admin.from('bookings').select('*').eq('id', row.id).maybeSingle();
      if (existing.data && Object.entries(row).every(([key, value]) => isDeepStrictEqual(existing.data[key], value)) && isDeepStrictEqual(existing.data.contract_record?.details, details)) return reply({ record: existing.data.contract_record });
      return reply({ error: 'رقم الحجز مستخدم أو تغيرت بياناته. حدّث الحجوزات قبل المحاولة.' }, 409);
    }
    return reply({ error: 'تعذر حفظ الحجز والعقد معًا. تحقق من حالة السيارة والاتصال؛ لم تكتمل العملية.' }, 409);
  }
  return reply({ record: data.contract_record });
}
