import { randomUUID } from 'node:crypto';
import { authorizeStaffRequest } from '@/lib/server/staff-auth';
import { CONTRACT_BUCKET, MAX_CONTRACT_FILE_BYTES, validateContractDetails, type ContractRecord } from '@/lib/rental-contract';
import { carImageExtension } from '@/lib/car-image-files';

export const runtime = 'nodejs';
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const validId = (id: unknown): id is string => typeof id === 'string' && /^[\w-]{1,100}$/.test(id);
const setupError = () => reply({ code: 'CONTRACT_SETUP_REQUIRED', error: 'حفظ بيانات العقد يحتاج تثبيت تحديث قاعدة البيانات 20261028_rental_contract.sql. يمكنك استخدام الطباعة الحالية.' }, 503);

async function readBooking(admin: NonNullable<Awaited<ReturnType<typeof authorizeStaffRequest>>['admin']>, id: string) {
  return admin.from('bookings').select('id,booking_number,final_total_egp,contract_record,car_id').eq('id', id).maybeSingle();
}

async function saveRecord(auth: Extract<Awaited<ReturnType<typeof authorizeStaffRequest>>, { ok: true }>, id: string, previous: ContractRecord | null, next: ContractRecord) {
  let query = auth.admin.from('bookings').update({ contract_record: next }).eq('id', id);
  query = previous ? query.eq('contract_record->>revision', previous.revision) : query.is('contract_record', null);
  const { data, error } = await query.select('id').maybeSingle();
  if (error) return reply({ error: 'تعذر حفظ بيانات العقد. أعد المحاولة.' }, 503);
  if (!data) return reply({ error: 'عدّل موظف آخر العقد. أعد فتحه للحصول على آخر نسخة.' }, 409);
  return null;
}

export async function GET(request: Request) {
  const auth = await authorizeStaffRequest(request);
  if (!auth.ok) return reply({ error: auth.error }, auth.status);
  const params = new URL(request.url).searchParams;
  const id = params.get('bookingId');
  if (!validId(id)) return reply({ error: 'الحجز غير صالح.' }, 400);
  const { data: booking, error } = await readBooking(auth.admin, id);
  if (error) return error.code === '42703' || error.code === 'PGRST204' ? setupError() : reply({ error: 'تعذر قراءة العقد.' }, 503);
  if (!booking) return reply({ error: 'الحجز غير موجود.' }, 404);
  const record = booking.contract_record as ContractRecord | null;
  const fileId = params.get('fileId');
  if (fileId) {
    const file = record?.attachments.find(file => file.id === fileId);
    if (!file || file.path !== `contracts/${id}/${file.id}.${file.type === 'application/pdf' ? 'pdf' : file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'}`) return reply({ error: 'المرفق غير موجود.' }, 404);
    const { data, error } = await auth.admin.storage.from(CONTRACT_BUCKET).createSignedUrl(file.path, 60, { download: `contract-${booking.booking_number}-${file.id}.${file.path.split('.').at(-1)}` });
    return error || !data ? reply({ error: 'تعذر تنزيل المرفق. أعد المحاولة.' }, 503) : reply({ url: data.signedUrl });
  }
  const { data: car } = await auth.admin.from('cars').select('year,vin,color').eq('id', booking.car_id).maybeSingle();
  return reply({ record, defaults: { carYear: car?.year ? String(car.year) : '', vin: car?.vin || '', carColor: car?.color || '' }, canEdit: ['super_admin', 'rental_agent'].includes(auth.staff.role) });
}

export async function POST(request: Request) {
  const auth = await authorizeStaffRequest(request);
  if (!auth.ok) return reply({ error: auth.error }, auth.status);
  if (!['super_admin', 'rental_agent'].includes(auth.staff.role)) return reply({ error: 'تعديل العقد متاح للمدير وموظف التأجير.' }, 403);
  const multipart = request.headers.get('content-type')?.startsWith('multipart/form-data');
  let values: Record<string, unknown>; let file: File | undefined;
  try {
    // Enforce a streaming bound even when Content-Length is absent.
    const limit = multipart ? MAX_CONTRACT_FILE_BYTES + 65536 : 32768;
    if (Number(request.headers.get('content-length')) > limit || !request.body) return reply({ error: 'حجم الطلب يتجاوز المسموح.' }, 413);
    const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > limit) { await reader.cancel(); return reply({ error: 'الحد الأقصى للمرفق 4 ميجابايت.' }, 413); } chunks.push(value); } }
    finally { reader.releaseLock(); }
    const body = Buffer.concat(chunks);
    if (multipart) {
      const form = await new Response(body, { headers: { 'Content-Type': request.headers.get('content-type')! } }).formData();
      const entry = form.get('file'); if (!entry || typeof entry === 'string') throw new Error(); file = entry;
      values = { bookingId: form.get('bookingId'), revision: form.get('revision') || null };
    } else { values = JSON.parse(body.toString('utf8')); }
  } catch { return reply({ error: 'تعذر قراءة بيانات العقد أو الملف.' }, 400); }
  if (!values || typeof values !== 'object' || Array.isArray(values)) return reply({ error: 'بيانات العقد غير صالحة.' }, 400);
  const id = values.bookingId;
  if (!validId(id)) return reply({ error: 'الحجز غير صالح.' }, 400);
  const { data: booking, error } = await readBooking(auth.admin, id);
  if (error) return error.code === '42703' || error.code === 'PGRST204' ? setupError() : reply({ error: 'تعذر قراءة الحجز.' }, 503);
  if (!booking) return reply({ error: 'الحجز غير موجود.' }, 404);
  const previous = booking.contract_record as ContractRecord | null;
  if ((previous?.revision || null) !== (values.revision || null)) return reply({ error: 'تغيّر العقد منذ فتحه. أعد فتحه قبل الحفظ.' }, 409);
  const next: ContractRecord = { revision: randomUUID(), details: previous?.details || {}, attachments: previous?.attachments || [], updatedAt: new Date().toISOString(), updatedBy: auth.staff.name };
  if (!file) {
    try { next.details = validateContractDetails(values.details, Number(booking.final_total_egp)); }
    catch (error) { return reply({ error: error instanceof Error ? error.message : 'راجع بيانات العقد.' }, 400); }
    const failure = await saveRecord(auth, id, previous, next); return failure || reply({ record: next });
  }
  if (next.attachments.length >= 8) return reply({ error: 'الحد الأقصى 8 مرفقات للعقد.' }, 400);
  if (!file.size || file.size > MAX_CONTRACT_FILE_BYTES) return reply({ error: 'الحد الأقصى للمرفق 4 ميجابايت.' }, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = file.type === 'application/pdf' && Buffer.from(bytes.slice(0, 5)).toString() === '%PDF-' ? 'pdf' : carImageExtension(file.type, bytes);
  if (!extension) return reply({ error: 'اختر PDF أو صورة JPG أو PNG أو WEBP صالحة.' }, 400);
  const fileId = randomUUID(); const path = `contracts/${id}/${fileId}.${extension}`;
  const { error: storageError } = await auth.admin.storage.from(CONTRACT_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (storageError) return reply({ error: 'تعذر رفع المرفق إلى التخزين الخاص. أعد المحاولة.' }, 503);
  next.attachments = [...next.attachments, { id: fileId, path, type: file.type, size: file.size, uploadedAt: next.updatedAt, uploadedBy: auth.staff.name }];
  const failure = await saveRecord(auth, id, previous, next);
  if (failure) {
    // A 503 may be an ambiguous commit/network failure; keep the object in that case.
    if (failure.status === 409) await auth.admin.storage.from(CONTRACT_BUCKET).remove([path]);
    return failure;
  }
  return reply({ record: next });
}
