import type { Car } from '@/types/fleet';
export function sortCarsForDisplay<T extends Pick<Car, 'id' | 'displayOrder'>>(cars: T[]): T[] {
  return [...cars].sort((a,b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id));
}
