export function addDaysToDateString(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;

  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, '0');
  const nextD = String(date.getDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

/**
 * حساب الفارق بالأيام بدقة بين تاريخين بصيغة YYYY-MM-DD
 */
export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1;
  const p1 = startDateStr.split('-').map(Number);
  const p2 = endDateStr.split('-').map(Number);
  if (p1.length !== 3 || p2.length !== 3) return 1;
  const start = new Date(p1[0], p1[1] - 1, p1[2]);
  const end = new Date(p2[0], p2[1] - 1, p2[2]);
  const diffTime = end.getTime() - start.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Number.isFinite(days) ? Math.max(1, days) : 1;
}

export function validateRentalDuration(start: string, end: string, minimum = 1): number {
  const valid = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  if (!valid(start) || !valid(end) || end < start) throw new Error('راجع تاريخ الاستلام والإرجاع؛ لا يمكن أن يسبق الإرجاع الاستلام.');
  const days = Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / 86400000));
  const minDays = Number.isFinite(minimum) ? Math.max(1, Math.ceil(minimum)) : 1;
  if (days < minDays) throw new Error(`أقل مدة لتأجير هذه السيارة ${minDays} أيام.`);
  return days;
}

