import { supabase } from '@/lib/supabase';
import { CAR_IMAGE_TYPES, MAX_CAR_IMAGE_BYTES } from '@/lib/car-image-files';

async function prepareCarImage(file: File): Promise<File> {
  if (!CAR_IMAGE_TYPES.includes(file.type as typeof CAR_IMAGE_TYPES[number])) throw new Error('اختر صورة JPG أو PNG أو WEBP.');
  if (file.size > 20 * 1024 * 1024) throw new Error('الصورة أكبر من 20 ميجابايت. اختر نسخة أصغر.');
  const source = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = source;
    try { await image.decode(); } catch { throw new Error('تعذر فتح الصورة. اختر ملف صورة صالحًا.'); }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('الصورة غير صالحة.');
    const scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
    if (scale === 1 && file.size <= 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذر تجهيز الصورة في هذا المتصفح.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.86, 0.76, 0.66]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      if (blob && blob.size <= MAX_CAR_IMAGE_BYTES) return new File([blob], 'car-image.' + (blob.type === 'image/webp' ? 'webp' : 'png'), { type: blob.type });
    }
    throw new Error('الصورة ما زالت أكبر من الحد المتاح. اختر صورة أصغر.');
  } finally { URL.revokeObjectURL(source); }
}

export async function uploadCarImage(file: File, signal: AbortSignal): Promise<string> {
  const image = await prepareCarImage(file);
  if (signal.aborted) throw new DOMException('Upload cancelled', 'AbortError');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('انتهت جلسة الدخول. سجّل الدخول مجددًا.');
  const body = new FormData(); body.set('file', image);
  const uploadSignal = typeof AbortSignal.any === 'function' ? AbortSignal.any([signal, AbortSignal.timeout(45_000)]) : signal;
  let response: Response;
  try { response = await fetch('/api/admin/cars/images', { method: 'POST', headers: { Authorization: 'Bearer ' + session.access_token }, body, signal: uploadSignal }); }
  catch (error) {
    if (signal.aborted) throw error;
    throw new Error('تعذر الاتصال بالتخزين أو انتهت مهلة الرفع. تحقق من الإنترنت وأعد المحاولة.');
  }
  let result;
  try { result = await response.json(); } catch { throw new Error('تعذر رفع الصورة. تحقق من حجمها والاتصال.'); }
  if (!response.ok) throw new Error(result.error || 'تعذر رفع الصورة.');
  if (typeof result.url !== 'string' || !result.url.startsWith('https://')) throw new Error('لم يصل رابط الصورة المحفوظة.');
  return result.url;
}
