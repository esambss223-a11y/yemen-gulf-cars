import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { MAINTENANCE_TABLES, type MaintenanceBackup, type MaintenanceOperation, type MaintenanceSnapshot } from '@/types/maintenance';

export const MAX_MAINTENANCE_BYTES = 3_000_000;
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
function mac(text: string, secret: string) { return createHmac('sha256', secret).update(text).digest('hex'); }
function same(a: unknown, b: string) {
  return typeof a === 'string' && /^[a-f0-9]{64}$/.test(a) && timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
export function backupPayload(backup: Omit<MaintenanceBackup, 'checksum' | 'signature'>) {
  return JSON.stringify({ format: backup.format, version: backup.version, project: backup.project, createdAt: backup.createdAt, tables: backup.tables });
}
export function makeBackup(snapshot: MaintenanceSnapshot, project: string, secret: string): MaintenanceBackup {
  const data = { format: 'ygcars-operational-backup' as const, version: 1 as const, project, createdAt: new Date().toISOString(), tables: snapshot.data };
  const checksum = digest(backupPayload(data));
  return { ...data, checksum, signature: mac(`backup-v1:${checksum}`, secret) };
}
export function validateBackup(value: unknown, project: string, secret: string): MaintenanceBackup {
  if (!value || typeof value !== 'object') throw new Error('INVALID_BACKUP');
  const b = value as MaintenanceBackup;
  if (b.format !== 'ygcars-operational-backup' || b.version !== 1 || b.project !== project ||
    typeof b.createdAt !== 'string' || !Number.isFinite(Date.parse(b.createdAt)) || !b.tables || typeof b.tables !== 'object' ||
    Object.keys(b.tables).length !== MAINTENANCE_TABLES.length ||
    MAINTENANCE_TABLES.some((table) => !Array.isArray(b.tables[table]) || b.tables[table].some((row) => !row || typeof row !== 'object' || Array.isArray(row)))) {
    throw new Error('INVALID_BACKUP');
  }
  const content = backupPayload(b);
  if (Buffer.byteLength(content) > MAX_MAINTENANCE_BYTES) throw new Error('BACKUP_TOO_LARGE');
  if (!same(b.checksum, digest(content)) || !same(b.signature, mac(`backup-v1:${b.checksum}`, secret))) {
    throw new Error('INVALID_BACKUP_SIGNATURE');
  }
  return b;
}
interface MaintenanceTicket {
  id: string; actor: string; project: string; operation: MaintenanceOperation;
  expires: number; fingerprint: string; staffFingerprint: string; restoreChecksum: string | null;
}
export function makeTicket(actor: string, project: string, operation: MaintenanceOperation, snapshot: MaintenanceSnapshot, restoreChecksum: string | null, secret: string) {
  const value: MaintenanceTicket = { id: randomUUID(), actor, project, operation, expires: Date.now() + 5 * 60_000,
    fingerprint: snapshot.fingerprint, staffFingerprint: snapshot.staffFingerprint, restoreChecksum };
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${mac(`ticket-v1:${payload}`, secret)}`;
}
export function readTicket(token: unknown, actor: string, project: string, secret: string): MaintenanceTicket {
  if (typeof token !== 'string' || token.length > 3000) throw new Error('INVALID_TICKET');
  const parts = token.split('.');
  if (parts.length !== 2 || !same(parts[1], mac(`ticket-v1:${parts[0]}`, secret))) throw new Error('INVALID_TICKET');
  let value: MaintenanceTicket;
  try { value = JSON.parse(Buffer.from(parts[0], 'base64url').toString()); } catch { throw new Error('INVALID_TICKET'); }
  if (!value || value.actor !== actor || value.project !== project || !Number.isFinite(value.expires) || value.expires < Date.now() ||
    !['reset', 'restore', 'repair'].includes(value.operation) || !/^[a-f0-9-]{36}$/.test(value.id) ||
    typeof value.fingerprint !== 'string' || typeof value.staffFingerprint !== 'string') throw new Error('INVALID_TICKET');
  return value;
}
