import type { Booking } from '@/types/fleet';

export interface FleetBookingSummary { total: number; open: number; next?: Booking; }
const priority: Partial<Record<Booking['status'], number>> = { active: 0, confirmed: 1, pending_approval: 2 };

// One pass for the list; preserve booking rows and their order in the source.
export function summarizeFleetBookings(bookings: Booking[]) {
  const summaries = new Map<string, FleetBookingSummary>();
  for (const booking of bookings) {
    const summary = summaries.get(booking.carId) ?? { total: 0, open: 0 };
    summary.total++;
    const rank = priority[booking.status];
    if (rank !== undefined) {
      summary.open++;
      const current = summary.next;
      if (!current || rank < priority[current.status]! || (rank === priority[current.status] && `${booking.startDate}:${booking.id}` < `${current.startDate}:${current.id}`)) summary.next = booking;
    }
    summaries.set(booking.carId, summary);
  }
  return summaries;
}
