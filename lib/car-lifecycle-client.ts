import { supabase } from '@/lib/supabase';

export async function carLifecycleRequest(carId: string, action: 'archive' | 'restore' | 'delete' | 'cancel_booking', bookingId?: string, reason?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('انتهت جلسة الدخول. سجل الدخول مجددًا.');
  const response = await fetch('/api/admin/cars/lifecycle', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ carId, action, bookingId, reason }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'تعذر إتمام العملية.');
  return result;
}
