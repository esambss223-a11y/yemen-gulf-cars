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

export type OwnerCompensationType = 'fixed_monthly' | 'fixed_daily' | 'percentage';

export interface VehicleOwner {
  id: string;
  name: string;
  phone: string;
  nationalId?: string; // الرقم القومي أو جواز السفر للمالك
  bankAccount?: string;
  commissionModel: OwnerCompensationType;
  ownerSharePercent: number; // مثلا 75 للمالك و 25 للشركة
  fixedDailyRateEGP?: number; // إيجار يومي مقطوع للمالك
  fixedMonthlyRateEGP?: number; // إيجار شهري مقطوع للمالك
  monthlyPayoutDay?: number; // يوم صرف المرتب الشهري (مثلا يوم 1 أو 5)
  notes?: string;
}

export interface Car {
  id: string;
  carCode?: string;           // كود العربية التسلسلي (مثلا: YG-001)
  make: string;               // الماركة مثلا: Mercedes-Benz
  model: string;              // الموديل مثلا: S-Class S500
  year: number;               // سنة الصنع مثلا: 2024
  category: CarCategory;      // الفئة
  plateNumber: string;        // رقم اللوحة مثلا: أ ب ج 1234
  vin?: string;               // رقم الشاسيه
  color: string;              // لون السيارة
  currentKm: number;          // عداد الكيلومترات الحالي
  initialHandoverKm?: number; // عداد الكيلومترات وقت استلام العربية من المالك
  fleetEntryDate?: string;    // تاريخ دخول العربية الأسطول
  contractStartDate?: string; // تاريخ بدء تعاقد تشغيل السيارة
  contractEndDate?: string;   // تاريخ انتهاء تعاقد تشغيل السيارة
  licenseExpiryDate?: string; // تاريخ انتهاء رخصة السيارة
  licenseRenewalDate?: string;// موعد تجديد الرخصة وفحص المرور
  nextServiceKm?: number;     // موعد الصيانة الدورية القادمة بالكيلومتر (يدوي)
  nextServiceDate?: string;   // موعد الصيانة الدورية القادمة بالتاريخ (يدوي)
  serviceResponsibleParty?: 'company' | 'owner'; // المسؤول عن تكاليف الصيانة
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
  ownerCompensationType?: OwnerCompensationType; // نظام إيجار المالك: شهري ثابت، يومي متفق عليه، أو نسبة
  ownerAgreedRateEGP?: number; // قيمة الإيجار المتفق عليه للمالك بالجنيه المصري
  features: string[];         // المميزات مثلا: مقاعد جلد، فتحة سقف، شاشات
  insuranceExpiryDate?: string; // تاريخ انتهاء تأمين السيارة
}

// 3. حالة الحجز والعملاء
export type BookingStatus = 'pending_approval' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type CustomerTier = 'vip_gold' | 'vip_silver' | 'regular' | 'blacklist';
export type CustomerRiskStatus = 'safe' | 'medium' | 'high_risk';

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  nationalId: string;       // الرقم القومي أو جواز السفر
  licenseNumber: string;    // رقم رخصة القيادة
  nationality?: string;     // الجنسية: مصري، سعودي، كويتي، إماراتي، إلخ
  tier?: CustomerTier;      // تصنيف العميل: VIP ذهبي / فضي / عادي / قائمة سوداء
  riskStatus?: CustomerRiskStatus; // مؤشر المخاطر: آمن / متوسط / عالي
  trustScore?: number;      // نقاط الثقة والأمان الرقمية (من 100)
  starRating?: number;      // متوسط تقييم النجوم (من 5)
  ratingCount?: number;     // عدد مرات تقييم العميل
  cleanlinessScore?: 'clean' | 'moderate' | 'dirty'; // مستوى النظافة المعتاد للسيارة
  damagesCount?: number;    // عدد حوادث أو أضرار سابقة
  loyaltyPoints?: number;   // نقاط المكافآت والولاء التراكمية القابلة للخصم
  totalRentalsCount?: number; // إجمالي عدد الحجوزات المكتملة
  totalSpentEGP?: number;   // إجمالي المبالغ المدفوعة بالجنيه
  notes?: string;           // ملاحظات سلوك العميل وتفضيلاته
  idPhotoUrl?: string;      // صورة البطاقة / الجواز إن وجدت
  licensePhotoUrl?: string; // صورة الرخصة إن وجدت
  identityVerified?: boolean;
  licenseVerified?: boolean;
  documentsVerifiedAt?: string;
  documentsVerifiedBy?: string;
  createdAt?: string;       // تاريخ تسجيل العميل
}

export interface BookingReviewInput {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  dailyRateEGP: number;
  discountAmountEGP: number;
  securityDepositEGP: number;
  nationalId: string;
  licenseNumber: string;
  identityVerified: boolean;
  licenseVerified: boolean;
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
  loyaltyPointsRedeemed?: number; // عدد نقاط الولاء المستبدلة في هذا الحجز
  loyaltyDiscountEGP?: number; // قيمة الخصم المالي الناتج عن نقاط الولاء
  finalTotalEGP: number;      // الإجمالي النهائي للإيجار
  securityDepositEGP: number; // مبلغ التأمين المسترد
  depositStatus: 'held' | 'refunded_full' | 'refunded_partial' | 'pending';
  startKm: number;            // قراءة العداد عند الاستلام
  returnKm?: number;          // قراءة العداد عند التسليم
  status: BookingStatus;
  staffId: string;            // الموظف الذي أنشأ أو اعتمد الحجز
  staffName: string;
  approvedByStaffName?: string; // الموظف المسؤول الذي فحص واعتمد الصفقة
  approvedAt?: string;        // وقت اعتماد الصفقة
  lateNoticeGiven?: boolean;  // هل أبلغ العميل مسبقاً بالتأخير؟
  lateHoursCount?: number;    // عدد ساعات التأخير إن وجدت
  latePenaltyFeeEGP?: number; // قيمة غرامة التأخير (200 ج.م/ساعة مع إبلاغ، أو يوم كامل بدون إبلاغ)
  damageFeeEGP?: number;      // رسوم إصلاح الأضرار والخدوش إن وُجدت
  damageDescription?: string; // وصف الضرر أو الصدمة إن وُجدت
  cleanlinessFeeEGP?: number; // رسوم غسيل إضافي إن وُجدت
  cleanlinessScore?: 'clean' | 'moderate' | 'dirty'; // حالة نظافة السيارة عند الاستلام
  customerRatingStars?: number; // تقييم الموظف للعميل بعد الاستلام (من 1 إلى 5)
  customerRecommendation?: 'recommend' | 'caution' | 'blacklist'; // توصية التعامل مع العميل
  returnInspectionStaff?: string; // اسم الموظف الذي فحص السيارة عند الاستلام
  createdAt: string;
  notes?: string;
}

// بيانات استلام وفحص السيارة وتقييم العميل
export interface ReturnInspectionPayload {
  lateNoticeGiven?: boolean;
  lateHours?: number;
  penaltyFee?: number;
  cleanlinessScore?: 'clean' | 'moderate' | 'dirty';
  cleanlinessFee?: number;
  hasDamages?: boolean;
  damageDescription?: string;
  damageFee?: number;
  customerRatingStars?: number;
  customerRecommendation?: 'recommend' | 'caution' | 'blacklist';
  inspectionNotes?: string;
  staffName?: string;
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

// 7. إحصائيات زوار الموقع
export interface VisitorStats {
  today: number;
  thisMonth: number;
  total: number;
  liveNow: number;
  lastUpdated: string;
  available: boolean;
}

