import type { Booking, BookingStatus } from '@/types/fleet';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending_approval: 'طلب قيد المراجعة', confirmed: 'حجز مؤكد', active: 'عقد جارٍ', completed: 'عقد مكتمل', cancelled: 'ملغى / مرفوض',
};
export function carHistory(bookings: Booking[], carId: string): Booking[] {
  return bookings.filter((booking) => booking.carId === carId).sort((a, b) =>
    `${b.startDate}T${b.startTime || '14:00'}`.localeCompare(`${a.startDate}T${a.startTime || '14:00'}`) || a.id.localeCompare(b.id));
}
export function filterCarHistory(bookings: Booking[], from: string, to: string, status: 'all' | BookingStatus): Booking[] {
  if (from && to && from > to) return [];
  return bookings.filter((booking) => (status === 'all' || booking.status === status) &&
    (!from || booking.endDate >= from) && (!to || booking.startDate <= to));
}
export function carRentalTotals(bookings: Booking[]) {
  // A future confirmed reservation is not an actual rental, nor is a cancelled request.
  const rentals = bookings.filter((booking) => booking.status === 'active' || booking.status === 'completed');
  const sum = (field: 'daysCount' | 'finalTotalEGP') => rentals.reduce((total, booking) =>
    total + (Number.isFinite(booking[field]) ? Math.max(0, booking[field]) : 0), 0);
  return { rentals: rentals.length, completed: rentals.filter((b) => b.status === 'completed').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length, days: sum('daysCount'), contractValue: sum('finalTotalEGP') };
}
export function cairoToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)?.value).join('-');
}
export function calendarMonth(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 1) % 7; // Arabic calendar starts on Saturday.
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return { offset, dates: Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    return { day, date: `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
  }) };
}
export function bookingsOnDay(bookings: Booking[], date: string) {
  return bookings.filter((booking) => booking.status !== 'cancelled' && booking.startDate <= date && booking.endDate >= date);
}
