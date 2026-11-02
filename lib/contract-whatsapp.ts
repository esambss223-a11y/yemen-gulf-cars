import type { Booking } from '@/types/fleet';
import { COMPANY_CONTACT } from './company-contact';

/**
 * تحويل رقم الهاتف إلى صيغة دولية متوافقة مع رابط واتساب (wa.me)
 */
export function normalizeWhatsAppNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  // إزالة أي رموز غير الأرقام
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // إذا بدأ بـ 00، إزالة الصفرين
  if (digits.startsWith('00')) {
    return digits.slice(2);
  }

  // إذا كان رقم مصري محلي يبدأ بـ 01 (11 رقماً)
  if (digits.length === 11 && digits.startsWith('01')) {
    return `20${digits.slice(1)}`;
  }

  // إذا كان رقم سعودي محلي يبدأ بـ 05 (10 أرقام)
  if (digits.length === 10 && digits.startsWith('05')) {
    return `966${digits.slice(1)}`;
  }

  // إذا كان رقم يمني محلي يبدأ بـ 7 (9 أرقام)
  if (digits.length === 9 && digits.startsWith('7')) {
    return `967${digits}`;
  }

  return digits;
}

/**
 * إنشاء نص رسالة واتساب الرسمية لملخص العقد والحجز
 */
export function generateContractWhatsAppMessage(booking: Booking): string {
  const depositText = booking.securityDepositEGP > 0
    ? `• التأمين المسترد: ${booking.securityDepositEGP.toLocaleString('ar-EG')} ج.م (يُرد فور فحص الاستلام)`
    : '• التأمين: لا يوجد مبلغ تأمين محتجز';

  return [
    '✨ *شركة اليمن والخليج لتأجير السيارات* ✨',
    'YEMEN & GULF LUXURY CAR RENTAL',
    '────────────────────────',
    `أهلاً بك أستاذ/ة *${booking.customer.fullName}*، يسعدنا خدمتكم 🚗`,
    '',
    `📄 *تفاصيل عقد الإيجار الرسمي:* #${booking.bookingNumber}`,
    `🚘 *السيارة:* ${booking.carName}`,
    `🔢 *رقم اللوحة:* ${booking.carPlate}`,
    `📅 *تاريخ الاستلام:* ${booking.startDate} (الساعة: ${booking.startTime || '14:00'})`,
    `🏁 *موعد الإرجاع:* ${booking.endDate} (الساعة: ${booking.endTime || '14:00'})`,
    `⏳ *مدة الإيجار:* ${booking.daysCount} أيام`,
    '',
    '💰 *الملخص المالي:*',
    `• صافي قيمة الإيجار: ${booking.finalTotalEGP.toLocaleString('ar-EG')} ج.م`,
    depositText,
    '',
    `📞 *للتواصل والدعم:* ${COMPANY_CONTACT.displayPhone}`,
    '📍 *الموقع:* القاهرة — جمهورية مصر العربية',
    'نتمنى لكم رحلة آمنة ومريحة! 🌟',
  ].join('\n');
}

/**
 * إنشاء رابط واتساب المباشر لفتح المحادثة مع العميل
 */
export function getContractWhatsAppUrl(booking: Booking): string {
  const targetPhone = booking.customer.whatsapp || booking.customer.phone;
  const cleanPhone = normalizeWhatsAppNumber(targetPhone);
  const text = generateContractWhatsAppMessage(booking);
  
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
