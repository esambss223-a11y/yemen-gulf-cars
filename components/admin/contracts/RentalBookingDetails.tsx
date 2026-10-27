import type { Booking } from '@/types/fleet';
import type { ReactNode } from 'react';
import FleetFormSection from '../modals/FleetFormSection';

const money = (n: number) => n.toLocaleString('ar-EG') + ' ج.م';
const depositStatus = { held: 'محتجز لدى الشركة', pending: 'قيد التسوية', refunded_full: 'مسترد بالكامل', refunded_partial: 'مسترد جزئيًا' };
function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return <dl className="fleet-contract-facts">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? 'غير مسجل'}</dd></div>)}</dl>;
}
export default function RentalBookingDetails({ booking }: { booking: Booking }) {
  return <div className="fleet-booking-layout"><div className="fleet-booking-sections">
    <FleetFormSection number="01" title="بيانات المستأجر" description="الطرف الثاني وبيانات التواصل والهوية المسجلة بالعقد."><Facts rows={[
      ['الاسم بالكامل', booking.customer.fullName], ['الجنسية', booking.customer.nationality || 'مصري'],
      ['رقم الهاتف', <a href={'tel:' + booking.customer.phone} key="phone"><bdi>{booking.customer.phone}</bdi></a>],
      ...(booking.customer.whatsapp ? [['واتساب', <a key="whatsapp" href={'https://wa.me/' + booking.customer.whatsapp.replace(/[^0-9]/g, '')} target="_blank" rel="noopener noreferrer"><bdi>{booking.customer.whatsapp}</bdi></a>]] as [string, ReactNode][] : []),
      ['الرقم القومي / جواز السفر', <bdi key="id">{booking.customer.nationalId}</bdi>], ['رخصة القيادة', <bdi key="license">{booking.customer.licenseNumber}</bdi>],
    ]} /></FleetFormSection>
    <FleetFormSection number="02" title="السيارة والمواعيد" description="بيانات المركبة ومواعيد الاستلام والإرجاع المتفق عليها."><Facts rows={[
      ['السيارة', booking.carName], ['رقم اللوحة', <bdi key="plate">{booking.carPlate}</bdi>],
      ['الاستلام', <bdi key="start">{booking.startDate} · {booking.startTime}</bdi>], ['الإرجاع المقرر', <bdi key="end">{booking.endDate} · {booking.endTime}</bdi>],
      ['مدة الإيجار', booking.daysCount.toLocaleString('ar-EG') + ' أيام'], ['الإرجاع الفعلي', booking.actualReturnDate || 'لم يسجّل بعد'],
      ['العداد عند الخروج', booking.startKm.toLocaleString('ar-EG') + ' كم'], ['العداد عند العودة', booking.returnKm === undefined ? 'قيد التشغيل' : booking.returnKm.toLocaleString('ar-EG') + ' كم'],
      ['الوقود والتجهيز عند التسليم', 'ممتلئ (Full)'],
    ]} /><p className="fleet-contract-note">شرط التأخير: 200 ج.م لكل ساعة مع الإبلاغ المسبق وموافقة الشركة، أو غرامة يوم كامل دون إبلاغ.</p></FleetFormSection>
    <FleetFormSection number="03" title="البيانات المالية والتوثيق" description="المبالغ المسجلة وقت إنشاء العقد؛ التأمين منفصل عن الإيجار."><Facts rows={[
      ['سعر اليوم', money(booking.dailyRateEGP)], ['الإيجار قبل الخصم', money(booking.totalRentEGP)],
      ['الخصم المعتمد', money(booking.discountAmountEGP)], ['كود الخصم', booking.discountCode || 'لا يوجد'],
      ['نقاط الولاء المستبدلة', (booking.loyaltyPointsRedeemed || 0).toLocaleString('ar-EG')], ['حالة التأمين', depositStatus[booking.depositStatus]],
      ['الموظف المسؤول', booking.staffName], ['تاريخ الإنشاء', booking.createdAt],
      ...(booking.approvedByStaffName ? [['اعتمد الحجز', booking.approvedByStaffName]] as [string, ReactNode][] : []),
    ]} /></FleetFormSection>
    {booking.notes && <FleetFormSection number="04" title="ملاحظات العقد والتسليم" description="الملاحظات المحفوظة على هذا الحجز."><p className="fleet-contract-notes">{booking.notes}</p></FleetFormSection>}
  </div><aside className="fleet-booking-summary"><span>الملخص المالي</span><h3>قيمة العقد</h3><p className="fleet-booking-summary-car">{booking.carName}<br /><bdi>{booking.bookingNumber}</bdi></p><dl>
    <div><dt>الإيجار قبل الخصم</dt><dd>{money(booking.totalRentEGP)}</dd></div>
    {booking.discountAmountEGP > 0 && <div className="is-discount"><dt>الخصم المعتمد</dt><dd>−{money(booking.discountAmountEGP)}</dd></div>}
    <div className="is-total"><dt>صافي الإيجار</dt><dd>{booking.finalTotalEGP.toLocaleString('ar-EG')} <small>ج.م</small></dd></div><div className="is-deposit"><dt>التأمين المسترد</dt><dd>{money(booking.securityDepositEGP)}</dd></div>
  </dl><p>حالة التأمين: {depositStatus[booking.depositStatus]}. يعرض هذا الملخص قيم العقد المسجلة.</p></aside></div>;
}
