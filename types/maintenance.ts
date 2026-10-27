export const MAINTENANCE_TABLES = ['owners', 'cars', 'customers', 'coupons', 'bookings', 'invoices', 'site_visits', 'permission_requests', 'audit_logs'] as const;
export type MaintenanceTable = typeof MAINTENANCE_TABLES[number];
export type MaintenanceOperation = 'reset' | 'restore' | 'repair';
export const MAINTENANCE_LABELS: Record<MaintenanceTable, string> = {
  owners: 'الملاك', cars: 'السيارات', customers: 'العملاء', coupons: 'الكوبونات', bookings: 'الحجوزات والعقود',
  invoices: 'الفواتير', site_visits: 'الزيارات', permission_requests: 'طلبات الصلاحيات', audit_logs: 'سجلات النشاط',
};
export const MAINTENANCE_PHRASES: Record<MaintenanceOperation, string> = {
  reset: 'تصفير بيانات التجارب', restore: 'استعادة بيانات التشغيل', repair: 'إصلاح حالة السيارات',
};
export interface MaintenanceSnapshot {
  data: Record<MaintenanceTable, Record<string, unknown>[]>;
  fingerprint: string;
  staffFingerprint: string;
}
export interface MaintenanceBackup {
  format: 'ygcars-operational-backup';
  version: 1;
  project: string;
  createdAt: string;
  tables: MaintenanceSnapshot['data'];
  checksum: string;
  signature: string;
}
export interface MaintenanceHealth {
  checkedAt: string;
  project: string;
  database: boolean;
  auth: boolean;
  storage: boolean;
  latencyMs: number;
  staffCount: number | null;
  authCount: number | null;
  buckets: number | null;
  engineReady: boolean;
  counts: Partial<Record<MaintenanceTable, number>>;
  issues: { label: string; count: number }[];
  errors: string[];
  history: { id: string; operation: string; created_at: string; affected: number }[];
}
