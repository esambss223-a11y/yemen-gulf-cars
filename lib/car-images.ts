import type { Car } from '@/types/fleet';

/** Keep the cover and gallery order identical wherever a public car is shown. */
export function getCarImages(car: Pick<Car, 'coverImage' | 'images'>): string[] {
  const images = [car.coverImage, ...(car.images || [])]
    .map((source) => source?.trim())
    .filter((source): source is string => Boolean(source));
  return images.length ? [...new Set(images)] : ['/car-mercedes.jpg'];
}
