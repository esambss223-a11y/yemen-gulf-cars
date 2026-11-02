export const CONTRACT_BUCKET = 'rental-contracts';
export const MAX_CONTRACT_FILE_BYTES = 4 * 1024 * 1024;
export const CONTRACT_FIELDS = {
  secondaryPhone: 'رقم هاتف إضافي',
  tenantAddress: 'عنوان المنزل', workAddress: 'عنوان العمل', idIssuer: 'جهة إصدار الهوية', governorate: 'المحافظة',
  licenseType: 'نوع الرخصة', licenseIssuer: 'جهة إصدار الرخصة', licenseIssuedAt: 'تاريخ إصدار الرخصة', licenseExpiresAt: 'تاريخ انتهاء الرخصة',
  carYear: 'سنة الموديل', vin: 'رقم الشاسيه', engineNumber: 'رقم الموتور', carColor: 'لون السيارة',
  handoverFuel: 'الوقود عند التسليم', returnFuel: 'الوقود عند العودة', conditionNotes: 'حالة السيارة وتجهيزاتها عند التسليم',
  driverName: 'اسم السائق الإضافي', driverAddress: 'عنوان السائق', driverNationalId: 'هوية السائق', driverLicenseNumber: 'رخصة السائق',
  driverLicenseType: 'نوع رخصة السائق', driverLicenseIssuer: 'جهة إصدار رخصة السائق', driverLicenseIssuedAt: 'تاريخ إصدار رخصة السائق', driverLicenseExpiresAt: 'تاريخ انتهاء رخصة السائق',
  rentPaidEGP: 'المدفوع من الإيجار حسب إيصال السداد',
} as const;
export type ContractDetails = Partial<Record<keyof typeof CONTRACT_FIELDS, string>>;
export function changeContractVehicle(details: ContractDetails = {}, car?: { year: number; vin?: string; color?: string }): ContractDetails {
  return { ...details, carYear: car ? String(car.year) : '', vin: car?.vin || '', carColor: car?.color || '', engineNumber: '', handoverFuel: '', returnFuel: '', conditionNotes: '' };
}
export interface ContractAttachment { id: string; path: string; type: string; size: number; uploadedAt: string; uploadedBy: string }
export interface ContractRecord { revision: string; details: ContractDetails; attachments: ContractAttachment[]; updatedAt: string; updatedBy: string }
export function normalizeSecondaryPhone(value: string): string {
  if (!value.trim()) return '';
  const phone = value.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776)).replace(/[\s().-]/g, '');
  if (!/^\+?\d{7,15}$/.test(phone)) throw new Error('راجع رقم الهاتف الإضافي، أو اتركه فارغًا إذا لم يوجد.');
  return phone;
}
export function validateContractDetails(input: unknown, rentTotal: number): ContractDetails {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('بيانات العقد غير صالحة.');
  const result: ContractDetails = {};
  for (const [key, value] of Object.entries(input)) {
    if (!Object.prototype.hasOwnProperty.call(CONTRACT_FIELDS, key) || typeof value !== 'string' || value.length > (key === 'conditionNotes' ? 1200 : 240)) throw new Error('أحد حقول العقد غير صالح أو أطول من المسموح.');
    const text = value.trim();
    if (key.endsWith('At') && text && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(new Date(text).getTime()) || new Date(text).toISOString().slice(0, 10) !== text)) throw new Error('أدخل تاريخًا صالحًا للرخصة.');
    result[key as keyof ContractDetails] = text;
  }
  for (const prefix of ['license', 'driverLicense']) {
    const issued = result[(prefix + 'IssuedAt') as keyof ContractDetails];
    const expires = result[(prefix + 'ExpiresAt') as keyof ContractDetails];
    if (issued && expires && expires < issued) throw new Error('انتهاء الرخصة يجب أن يكون بعد تاريخ إصدارها.');
  }
  if (result.secondaryPhone !== undefined) result.secondaryPhone = normalizeSecondaryPhone(result.secondaryPhone);
  if (result.rentPaidEGP && (!/^\d+(\.\d{1,2})?$/.test(result.rentPaidEGP) || Number(result.rentPaidEGP) > rentTotal)) throw new Error('المدفوع يجب أن يكون بين صفر وصافي الإيجار.');
  return result;
}
