import { randomUUID } from 'node:crypto';
import { authorizeStaffRequest } from '@/lib/server/staff-auth';
import { CAR_IMAGE_BUCKET, CAR_IMAGE_TYPES, MAX_CAR_IMAGE_BYTES, carImageExtension } from '@/lib/car-image-files';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = MAX_CAR_IMAGE_BYTES + 64 * 1024;
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function readUpload(request: Request): Promise<FormData> {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new Error('TOO_LARGE');
  if (!request.body) throw new Error('MISSING_BODY');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error('TOO_LARGE'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
}

export async function POST(request: Request) {
  const auth = await authorizeStaffRequest(request, true);
  if (!auth.ok) return reply({ error: auth.error }, auth.status);
  let form: FormData;
  try { form = await readUpload(request); }
  catch (error) { return reply({ error: error instanceof Error && error.message === 'TOO_LARGE' ? 'حجم الصورة يتجاوز 4 ميجابايت بعد التجهيز.' : 'تعذر قراءة ملف الصورة.' }, error instanceof Error && error.message === 'TOO_LARGE' ? 413 : 400); }
  const file = form.get('file');
  if (!file || typeof file === 'string' || !file.size || !CAR_IMAGE_TYPES.includes(file.type as typeof CAR_IMAGE_TYPES[number])) {
    return reply({ error: 'اختر صورة بصيغة JPG أو PNG أو WEBP.' }, 400);
  }
  if (file.size > MAX_CAR_IMAGE_BYTES) return reply({ error: 'الحد الأقصى للصورة 4 ميجابايت.' }, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = carImageExtension(file.type, bytes);
  if (!extension) return reply({ error: 'الملف لا يطابق صيغة الصورة المحددة.' }, 400);
  const path = `cars/${auth.staff.id}/${randomUUID()}.${extension}`;
  const { error } = await auth.admin.storage.from(CAR_IMAGE_BUCKET).upload(path, bytes, {
    contentType: file.type, cacheControl: '31536000', upsert: false,
  });
  if (error) {
    console.error('[car-image:UPLOAD_FAILED]', error.name || 'STORAGE_ERROR');
    return reply({ error: 'تعذر رفع الصورة إلى التخزين. لم تُضف إلى السيارة؛ تحقق من الاتصال وأعد المحاولة.' }, 503);
  }
  const { data } = auth.admin.storage.from(CAR_IMAGE_BUCKET).getPublicUrl(path);
  return reply({ url: data.publicUrl, path, size: file.size });
}
