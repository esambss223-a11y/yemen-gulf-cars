import { authorizeStaffRequest } from '@/lib/server/staff-auth';

type NotificationTarget = 'bookings' | 'cars' | 'staff';
type AdminNotification = {
  id: string;
  type: 'booking' | 'license' | 'insurance' | 'contract' | 'permission';
  title: string;
  detail: string;
  target: NotificationTarget;
  createdAt?: string;
  requestId?: string;
};

function expiryNotifications(
  cars: Array<Record<string, any>>,
  field: 'license_expiry_date' | 'insurance_expiry_date' | 'contract_end_date',
  type: 'license' | 'insurance' | 'contract',
  label: string,
  today: string,
): AdminNotification[] {
  const todayTime = new Date(`${today}T00:00:00.000Z`).getTime();
  const target: NotificationTarget = type === 'contract' ? 'cars' : 'cars';

  return cars.flatMap((car) => {
    const date = typeof car[field] === 'string' ? car[field] : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const expiryTime = new Date(`${date}T00:00:00.000Z`).getTime();
    if (!Number.isFinite(expiryTime)) return [];
    const days = Math.ceil((expiryTime - todayTime) / 86_400_000);
    if (days > 30) return [];
    const state = days < 0 ? 'منتهية منذ' : days === 0 ? 'تنتهي اليوم' : 'تنتهي خلال';
    const when = days < 0 ? `${Math.abs(days)} يوم` : `${days} يوم`;
    return [{
      id: `${type}:${car.id}`,
      type,
      title: days <= 0 ? `${label} منتهية` : `${label} قاربت على الانتهاء`,
      detail: `${car.make || ''} ${car.model || ''} — ${state} ${when} (${date})`,
      target,
    }];
  });
}

export async function GET(request: Request) {
  const auth = await authorizeStaffRequest(request);
  if (!auth.ok) return Response.json({ code: 'NOT_AUTHORIZED', error: auth.error }, { status: auth.status });

  const [{ data: bookings, error: bookingsError }, { data: cars, error: carsError }] = await Promise.all([
    auth.admin.from('bookings')
      .select('id, booking_number, car_name, customer, created_at')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false }),
    auth.admin.from('cars')
      .select('id, make, model, license_expiry_date, insurance_expiry_date, contract_end_date').neq('status', 'archived'),
  ]);

  if (bookingsError || carsError) {
    return Response.json({ code: 'NOTIFICATIONS_UNAVAILABLE', error: 'تعذر تحميل التنبيهات من قاعدة البيانات.' }, { status: 503 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const notifications: AdminNotification[] = (bookings || []).map((booking) => {
    const customer = typeof booking.customer === 'string' ? JSON.parse(booking.customer) : booking.customer;
    return {
      id: `booking:${booking.id}`,
      type: 'booking',
      title: 'طلب حجز جديد بانتظار المراجعة',
      detail: `${booking.booking_number} — ${booking.car_name} — ${customer?.fullName || 'عميل جديد'}`,
      target: 'bookings',
      createdAt: booking.created_at,
    };
  });

  notifications.push(
    ...expiryNotifications(cars || [], 'license_expiry_date', 'license', 'رخصة السيارة', today),
    ...expiryNotifications(cars || [], 'insurance_expiry_date', 'insurance', 'تأمين السيارة', today),
    ...expiryNotifications(cars || [], 'contract_end_date', 'contract', 'عقد السيارة', today),
  );

  if (auth.staff.role === 'super_admin') {
    const { data: requests, error: requestsError } = await auth.admin
      .from('permission_requests')
      .select('id, staff_id, requested_role, reason, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (requestsError) {
      return Response.json({ code: 'PERMISSION_NOTIFICATIONS_UNAVAILABLE', error: 'تعذر تحميل طلبات الصلاحيات. حدّث قاعدة البيانات أولًا.' }, { status: 503 });
    }

    const staffIds = [...new Set((requests || []).map((item) => item.staff_id))];
    const staffLookup = staffIds.length
      ? await auth.admin.from('staff').select('id, name, username').in('id', staffIds)
      : { data: [], error: null };
    if (staffLookup.error) {
      return Response.json({ code: 'PERMISSION_STAFF_LOOKUP_FAILED', error: 'تعذر إظهار أسماء الموظفين في طلبات الصلاحيات.' }, { status: 503 });
    }
    const staffById = new Map((staffLookup.data || []).map((member) => [member.id, member]));
    const roleNames: Record<string, string> = {
      super_admin: 'مدير عام', rental_agent: 'مسؤول تأجير', accountant: 'محاسب',
    };
    notifications.push(...(requests || []).map((item) => {
      const member = staffById.get(item.staff_id);
      return {
        id: `permission:${item.id}`,
        requestId: item.id,
        type: 'permission' as const,
        title: 'طلب صلاحية من موظف',
        detail: `${member?.name || member?.username || 'موظف'} يطلب صلاحية ${roleNames[item.requested_role] || item.requested_role}${item.reason ? ` — ${item.reason}` : ''}`,
        target: 'staff' as const,
        createdAt: item.created_at,
      };
    }));
  }

  return Response.json({ notifications });
}
