import type { StaffUser } from '@/types/fleet';

export type AdminTab = 'overview' | 'cars' | 'bookings' | 'customers' | 'owners' | 'staff' | 'coupons' | 'audit' | 'profile';

const sections: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'الرئيسية' },
  { id: 'cars', label: 'السيارات' },
  { id: 'bookings', label: 'الحجوزات والعقود' },
  { id: 'customers', label: 'دليل العملاء' },
  { id: 'owners', label: 'الملاك والشركاء' },
  { id: 'staff', label: 'فريق العمل والصلاحيات' },
  { id: 'coupons', label: 'العروض وأكواد الخصم' },
  { id: 'audit', label: 'التقارير وسجل الرقابة' },
  { id: 'profile', label: 'الإعدادات وحسابي' },
];

// Presentation uses the existing role rules; server authorization is unchanged.
const allowedTabs: Record<string, AdminTab[]> = {
  super_admin: sections.map(({ id }) => id),
  rental_agent: ['overview', 'cars', 'bookings', 'customers', 'profile'],
  accountant: ['overview', 'cars', 'bookings', 'customers', 'profile'],
  fleet_entry: ['cars', 'profile'],
};

export function getAdminSections(staff: StaffUser) {
  const allowed = allowedTabs[staff.role] || allowedTabs.rental_agent;
  return sections.filter(({ id }) => allowed.includes(id)).map((section) => ({
    ...section,
    label: section.id === 'overview' && staff.maintenanceAccess ? 'مركز المبرمج' : section.label,
  }));
}

export function getAdminSectionTitle(tab: AdminTab, staff: StaffUser) {
  return getAdminSections(staff).find(({ id }) => id === tab)?.label || 'لوحة الإدارة';
}

export function getStaffRoleLabel(staff: StaffUser) {
  if (staff.maintenanceAccess) return 'مبرمج النظام';
  return { 
    super_admin: 'مدير عام', 
    rental_agent: 'موظف تأجير', 
    accountant: 'محاسب مالي',
    fleet_entry: 'مسؤول إدخال الأسطول'
  }[staff.role] || 'موظف';
}
