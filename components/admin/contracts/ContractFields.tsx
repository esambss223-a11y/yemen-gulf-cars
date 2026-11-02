'use client';
import { CONTRACT_FIELDS, type ContractDetails } from '@/lib/rental-contract';
export type ContractField = keyof typeof CONTRACT_FIELDS;
export const CONTRACT_GROUPS: { key: string; title: string; fields: ContractField[] }[] = [
  { key: 'contact', title: 'رقم التواصل الإضافي — اختياري', fields: ['secondaryPhone'] },
  { key: 'address', title: 'عنوان المستأجر والهوية', fields: ['tenantAddress', 'workAddress', 'idIssuer', 'governorate'] },
  { key: 'license', title: 'تفاصيل رخصة القيادة', fields: ['licenseType', 'licenseIssuer', 'licenseIssuedAt', 'licenseExpiresAt'] },
  { key: 'vehicle', title: 'السيارة وحالة التسليم', fields: ['carYear', 'carColor', 'vin', 'engineNumber', 'handoverFuel', 'returnFuel', 'conditionNotes'] },
  { key: 'driver', title: 'السائق الإضافي — إن وجد', fields: ['driverName', 'driverAddress', 'driverNationalId', 'driverLicenseNumber', 'driverLicenseType', 'driverLicenseIssuer', 'driverLicenseIssuedAt', 'driverLicenseExpiresAt'] },
  { key: 'payment', title: 'بيان السداد في العقد', fields: ['rentPaidEGP'] },
];
export default function ContractFields({ fields, value, onChange, rentTotal }: { fields: ContractField[]; value: ContractDetails; onChange: (value: ContractDetails) => void; rentTotal: number }) {
  return <div className="fleet-booking-fields">{fields.map(key => <label className={'fleet-booking-field ' + (['tenantAddress', 'workAddress', 'driverAddress', 'conditionNotes'].includes(key) ? 'is-wide' : '')} key={key}><span>{CONTRACT_FIELDS[key]}</span>
    {key === 'conditionNotes' ? <textarea maxLength={1200} value={value[key] || ''} onChange={event => onChange({ ...value, [key]: event.target.value })} /> : <input type={key.endsWith('At') ? 'date' : key === 'rentPaidEGP' ? 'number' : key === 'secondaryPhone' ? 'tel' : 'text'} dir={key === 'secondaryPhone' ? 'ltr' : undefined} min={key === 'rentPaidEGP' ? 0 : undefined} max={key === 'rentPaidEGP' ? rentTotal : undefined} step={key === 'rentPaidEGP' ? '0.01' : undefined} maxLength={key === 'secondaryPhone' ? 30 : 240} value={value[key] || ''} onChange={event => onChange({ ...value, [key]: event.target.value })} />}
  </label>)}</div>;
}
