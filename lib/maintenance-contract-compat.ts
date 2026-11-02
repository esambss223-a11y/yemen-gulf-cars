import type { MaintenanceSnapshot } from '@/types/maintenance';

// Run only after the original backup signature/checksum has been verified.
export function normalizeContractBackup(tables: MaintenanceSnapshot['data']): MaintenanceSnapshot['data'] {
  return { ...tables, bookings: tables.bookings.map(row => ({ ...row, contract_record: row.contract_record ?? null })) };
}

export function normalizeDurationPriceBackup(tables: MaintenanceSnapshot['data']): MaintenanceSnapshot['data'] {
  return { ...tables, cars: tables.cars.map(row => ({ ...row, rental_price_tiers: row.rental_price_tiers ?? null })) };
}
