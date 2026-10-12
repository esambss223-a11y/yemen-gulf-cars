/**
 * أنواع وبيانات منظومة يمن الخليج لإدارة وتأجير السيارات (Yemen Gulf Fleet ERP Types)
 * العملة الرسمية المعتمدة: الجنيه المصري (EGP - ج.م)
 */

// 1. أدوار وصلاحيات الموظفين
export type UserRole = 'super_admin' | 'rental_agent' | 'accountant';

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  phone: string;
  password?: string;
  avatar?: string;
  active: boolean;
}

// 2. حالة المركبة
export type CarStatus = 'available' | 'rented' | 'maintenance' | 'cleaning';
export type CarCategory = 'vip' | 'suv' | 'luxury_sedan' | 'economy';
export type OwnershipType = 'company' | 'investor';

export interface VehicleOwner {
  id: string;
  name: string;
  phone: string;
  bankAccount?: string;
  commissionModel: 'percentage' | 'fixed_daily';
  ownerSharePercent: number; // مثلا 75 للمالك و 25 للشركة
  fixedDailyRateEGP?: number; // أو مبلغ يومي مقطوع
  notes?: string;
}

export interface Car {
  id: string;
  make: string;               // الماركة مثلا: Mercedes-Benz
  model: string;              // الموديل مثلا: S-Class S500
  year: number;               // سنة الصنع مثلا: 2024
  category: CarCategory;      // الفئة
  plateNumber: string;        // رقم اللوحة مثلا: أ ب ج 1234
  vin?: string;               // رقم الشاسيه
  color: string;              // لون السيارة
  currentKm: number;          // عداد الكيلومترات الحالي
  dailyPriceEGP: number;      // سعر اليوم بالجنيه المصري
  weeklyPriceEGP?: number;    // سعر الأسبوع بالجنيه المصري
  monthlyPriceEGP?: number;   // سعر الشهر بالجنيه المصري
  securityDepositEGP: number; // مبلغ التأمين المسترد بالجنيه المصري
  status: CarStatus;          // حالة السيارة الحالية
  images: string[];           // مصفوفة روابط الصور المتعددة
  coverImage: string;         // الصورة الرئيسية
  transmission: 'automatic' | 'manual';
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  ownership: OwnershipType;   // هل هي ملك الشركة أم مستثمر خارجي
  ownerId?: string;           // معرف المالك إن وجد
  ownerName?: string;
  features: string[];         // المميزات مثلا: مقاعد جلد، فتحة سقف، شاشات
  insuranceExpiryDate?: string; // تاريخ انتهاء تأمين السيارة
}

// 3. حالة الحجز
export type BookingStatus = 'confirmed' | 'active' | 'completed' | 'cancelled';

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  nationalId: string;       // الرقم القومي أو جواز السفر
  licenseNumber: string;    // رقم رخصة القيادة
  nationality?: string;
}

export interface Booking {
  id: string;                 // رقم الحجز التعريفي
  bookingNumber: string;       // رقم تسلسلي للعقد مثلا: BK-2026-001
  carId: string;
  carName: string;
  carPlate: string;
  customer: Customer;
  startDate: string;          // تاريخ الاستلام
  startTime: string;          // وقت الاستلام
  endDate: string;            // تاريخ الإرجاع المتوقع
  endTime: string;            // وقت الإرجاع المتوقع
  actualReturnDate?: string;  // تاريخ الإرجاع الفعلي
  daysCount: number;          // عدد الأيام
  dailyRateEGP: number;       // السعر اليومي وقت الحجز
  totalRentEGP: number;       // إجمالي الإيجار قبل الخصم
  discountCode?: string;      // كود الخصم المطبق
  discountAmountEGP: number;  // قيمة الخصم المطبق
  finalTotalEGP: number;      // الإجمالي النهائي للإيجار
  securityDepositEGP: number; // مبلغ التأمين المسترد
  depositStatus: 'held' | 'refunded_full' | 'refunded_partial' | 'pending';
  startKm: number;            // قراءة العداد عند الاستلام
  returnKm?: number;          // قراءة العداد عند التسليم
  status: BookingStatus;
  staffId: string;            // الموظف الذي أنشأ الحجز
  staffName: string;
  createdAt: string;
  notes?: string;
}

// 4. الفواتير
export interface Invoice {
  id: string;
  invoiceNumber: string;      // رقم الفاتورة مثلا: INV-2026-001
  bookingId: string;
  customerName: string;
  customerPhone: string;
  carDetails: string;
  totalAmountEGP: number;
  depositAmountEGP: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'instapay' | 'card';
  paid: boolean;
  issuedAt: string;
  issuedBy: string;
}

// 5. أكواد الخصم
export interface PromoCoupon {
  id: string;
  code: string;               // مثلا: VIP2026
  discountType: 'percentage' | 'fixed_egp';
  discountValue: number;      // مثلا 10% أو 500 جنيه
  expiresAt: string;
  maxUsage: number;
  usedCount: number;
  active: boolean;
}

// 6. سجل الرقابة والأمان (Audit Log)
export interface AuditLogItem {
  id: string;
  action: string;
  staffName: string;
  staffRole: string;
  timestamp: string;
  details: string;
}
