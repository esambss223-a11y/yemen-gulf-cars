import type { Booking } from '@/types/fleet';

export type CarFleetFilter = 'all' | 'available' | 'rented' | 'maintenance' | 'archived';
export function carRemovalState(bookings: Booking[], carId: string) {
  const history = bookings.filter((b) => b.carId === carId);
  const open = history.filter((b) => b.status !== 'completed' && b.status !== 'cancelled');
  const priority: Record<string, number> = { active: 0, confirmed: 1, pending_approval: 2 };
  open.sort((a, b) => (priority[a.status] ?? 3) - (priority[b.status] ?? 3) || a.startDate.localeCompare(b.startDate));
  return { history, open, canArchive: open.length === 0, canDelete: history.length === 0 };
}
