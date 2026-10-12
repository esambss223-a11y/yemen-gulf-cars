import { Car, VehicleOwner, Booking, Invoice, PromoCoupon, StaffUser, AuditLogItem } from '@/types/fleet';

// 1. حسابات الموظفين الأولية للتجربة
export const INITIAL_STAFF: StaffUser[] = [
  {
    id: 'staff-1',
    name: 'المهندس عصام (المدير العام)',
    username: 'admin',
    role: 'super_admin',
    phone: '+20 100 000 0001',
    password: 'admin',
    active: true,
  },
  {
    id: 'staff-2',
    name: 'أحمد محمود (مسؤول التأجير والاستقبال)',
    username: 'agent',
    role: 'rental_agent',
    phone: '+20 100 000 0002',
    password: 'agent',
    active: true,
  },
  {
    id: 'staff-3',
    name: 'سارة إبراهيم (المحاسب المالي)',
    username: 'accountant',
    role: 'accountant',
    phone: '+20 100 000 0003',
    password: 'acc',
    active: true,
  },
];

// 2. ملاك السيارات والشركاء الأوليين
export const INITIAL_OWNERS: VehicleOwner[] = [
  {
    id: 'owner-1',
    name: 'شركة يمن الخليج (أسطول الشركة)',
    phone: '+20 100 123 4567',
    commissionModel: 'percentage',
    ownerSharePercent: 100,
    notes: 'السيارات المملوكة للشركة مباشرة',
  },
  {
    id: 'owner-2',
    name: 'الشيخ عبد الله بن منصور (مستثمر)',
    phone: '+20 111 222 3333',
    commissionModel: 'percentage',
    ownerSharePercent: 75, // 75% للمالك و 25% للشركة
    notes: 'عقد مشاركة أرباح VIP بنسبة 75%',
  },
];

// 3. الأسطول الأولي (بالجنيه المصري EGP)
export const INITIAL_CARS: Car[] = [
  {
    id: 'car-1',
    make: 'Mercedes-Benz',
    model: 'S-Class S500',
    year: 2024,
    category: 'vip',
    plateNumber: 'م ص ر 1928',
    color: 'أسود ملكي فاخر',
    currentKm: 14200,
    dailyPriceEGP: 8500,
    weeklyPriceEGP: 55000,
    securityDepositEGP: 15000,
    status: 'available',
    images: ['/car-mercedes.jpg'],
    coverImage: '/car-mercedes.jpg',
    transmission: 'automatic',
    fuelType: 'petrol',
    seats: 5,
    ownership: 'investor',
    ownerId: 'owner-2',
    ownerName: 'الشيخ عبد الله بن منصور (مستثمر)',
    features: ['سائق خاص متوفر', 'مقاعد مساج وتبريد', 'شاشات خلفية VIP', 'سقف بانوراما'],
    insuranceExpiryDate: '2026-12-31',
  },
  {
    id: 'car-2',
    make: 'Range Rover',
    model: 'Autobiography LWB',
    year: 2024,
    category: 'suv',
    plateNumber: 'ق هـ ر 7741',
    color: 'أبيض لؤلؤي مع سقف أسود',
    currentKm: 22100,
    dailyPriceEGP: 12000,
    weeklyPriceEGP: 78000,
    securityDepositEGP: 20000,
    status: 'rented',
    images: ['/car-rangerover.jpg'],
    coverImage: '/car-rangerover.jpg',
    transmission: 'automatic',
    fuelType: 'petrol',
    seats: 5,
    ownership: 'company',
    ownerId: 'owner-1',
    ownerName: 'شركة يمن الخليج (أسطول الشركة)',
    features: ['دفع رباعي فاخر', 'نظام صوت Meridian 3D', 'ثلاجة مقصورة', 'عزل صوتي فائق'],
    insuranceExpiryDate: '2026-11-15',
  },
  {
    id: 'car-3',
    make: 'Nissan',
    model: 'Patrol Platinum V8',
    year: 2024,
    category: 'suv',
    plateNumber: 'ج ي ز 5502',
    color: 'رمادي تيتانيوم',
    currentKm: 31000,
    dailyPriceEGP: 6500,
    weeklyPriceEGP: 42000,
    securityDepositEGP: 10000,
    status: 'available',
    images: ['/car-nissan.jpg'],
    coverImage: '/car-nissan.jpg',
    transmission: 'automatic',
    fuelType: 'petrol',
    seats: 7,
    ownership: 'company',
    ownerId: 'owner-1',
    ownerName: 'شركة يمن الخليج (أسطول الشركة)',
    features: ['7 مقاعد جلد واسعة', 'عائلي وفاره', 'نظام ملاحة متطور', 'شاشات ترفيه'],
    insuranceExpiryDate: '2027-01-20',
  },
];

// 4. الحجوزات الأولية
export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-1',
    bookingNumber: 'BK-2026-001',
    carId: 'car-2',
    carName: 'Range Rover Autobiography LWB 2024',
    carPlate: 'ق هـ ر 7741',
    customer: {
      id: 'cust-1',
      fullName: 'محمد عبد الرحمن القحطاني',
      phone: '+20 102 345 6789',
      whatsapp: '+966 50 123 4567',
      nationalId: '10987654321',
      licenseNumber: 'LIC-998822',
      nationality: 'سعودي',
    },
    startDate: '2026-10-10',
    startTime: '14:00',
    endDate: '2026-10-15',
    endTime: '14:00',
    daysCount: 5,
    dailyRateEGP: 12000,
    totalRentEGP: 60000,
    discountCode: 'VIP2026',
    discountAmountEGP: 5000,
    finalTotalEGP: 55000,
    securityDepositEGP: 20000,
    depositStatus: 'held',
    startKm: 21500,
    status: 'active',
    staffId: 'staff-2',
    staffName: 'أحمد محمود',
    createdAt: '2026-10-10 13:45',
    notes: 'استلام بمطار القاهرة الدولي مع خدمة سائق VIP',
  },
];

// 5. أكواد الخصم الأولية
export const INITIAL_COUPONS: PromoCoupon[] = [
  {
    id: 'cp-1',
    code: 'VIP2026',
    discountType: 'fixed_egp',
    discountValue: 5000,
    expiresAt: '2026-12-31',
    maxUsage: 50,
    usedCount: 7,
    active: true,
  },
  {
    id: 'cp-2',
    code: 'GULF10',
    discountType: 'percentage',
    discountValue: 10,
    expiresAt: '2026-11-30',
    maxUsage: 100,
    usedCount: 14,
    active: true,
  },
];

// 6. الفواتير الأولية
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    bookingId: 'bk-1',
    customerName: 'محمد عبد الرحمن القحطاني',
    customerPhone: '+20 102 345 6789',
    carDetails: 'Range Rover Autobiography LWB 2024 (لوحة: ق هـ ر 7741)',
    totalAmountEGP: 55000,
    depositAmountEGP: 20000,
    paymentMethod: 'instapay',
    paid: true,
    issuedAt: '2026-10-10 14:00',
    issuedBy: 'أحمد محمود',
  },
];

// 7. سجل الرقابة الأولي
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    action: 'تسليم سيارة وإنشاء عقد',
    staffName: 'أحمد محمود',
    staffRole: 'مسؤول تأجير',
    timestamp: '2026-10-10 14:00:15',
    details: 'تم تسليم رينج روفر للعميل محمد القحطاني بالعقد رقم BK-2026-001 مع حجز تأمين 20,000 ج.م',
  },
];
