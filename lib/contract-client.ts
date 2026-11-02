import type { ContractDetails, ContractRecord } from './rental-contract';
export interface ContractResponse { record: ContractRecord | null; defaults?: ContractDetails; canEdit?: boolean }
export async function contractRequest(bookingId: string, options: { details?: ContractDetails; revision?: string; file?: File; fileId?: string; signal?: AbortSignal } = {}): Promise<ContractResponse & { url?: string }> {
  const { supabase } = await import('@/lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('انتهت جلسة الدخول. سجّل الدخول مجددًا.');
  const headers: Record<string, string> = { Authorization: 'Bearer ' + session.access_token };
  let body: FormData | string | undefined;
  if (options.file) {
    body = new FormData(); body.set('file', options.file); body.set('bookingId', bookingId); body.set('revision', options.revision || '');
  } else if (options.details) {
    headers['Content-Type'] = 'application/json'; body = JSON.stringify({ bookingId, revision: options.revision, details: options.details });
  }
  const params = new URLSearchParams({ bookingId }); if (options.fileId) params.set('fileId', options.fileId);
  const signal = typeof AbortSignal.any === 'function' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.any([...(options.signal ? [options.signal] : []), AbortSignal.timeout(45_000)]) : options.signal;
  let response: Response;
  try { response = await fetch('/api/admin/contracts?' + params, { method: body ? 'POST' : 'GET', headers, body, signal }); }
  catch (error) { if (options.signal?.aborted) throw error; throw new Error('تعذر الاتصال. تحقق من الإنترنت وأعد المحاولة.'); }
  let result;
  try { result = await response.json(); } catch { throw new Error('تعذر إكمال العملية. تأكد أن الملف لا يتجاوز 4 ميجابايت.'); }
  if (!response.ok) throw new Error(result.error || 'تعذر حفظ العقد.');
  return result;
}
