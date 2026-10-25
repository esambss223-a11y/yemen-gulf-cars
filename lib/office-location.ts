// The supplied share.google link and existing Maps link resolve to /g/11p1_zz89t.
// Coordinates below are the place marker, not the map camera's center.
export const OFFICE_LOCATION = {
  name: 'شركة اليمن والخليج',
  address: 'حدائق أكتوبر • محافظة الجيزة • جمهورية مصر العربية',
  mapsUrl: 'https://www.google.com/maps?cid=45157466133356522',
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('شركة اليمن والخليج، حدائق أكتوبر، الجيزة')}&destination_place_id=ChIJHeLlKB9RWBQR6t_V53luoAA&travelmode=driving&hl=ar`,
  embedUrl: 'https://www.google.com/maps/embed?origin=mfe&pb=!1m3!3m2!1m1!4s45157466133356522!3m1!1sar!5m1!1sar',
} as const;
