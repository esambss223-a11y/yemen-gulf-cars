/* eslint-disable @next/next/no-img-element -- The printable document uses a regular image with awaited decoding. */
import type { Booking } from '@/types/fleet';
import { COMPANY_CONTACT } from '@/lib/company-contact';
import { BOOKING_STATUS_LABELS } from '@/lib/car-record';
import { CONTRACT_DOCUMENT_STYLES } from './contract-document-styles';

// Existing contract terms retained verbatim; presentation changes only.
export const RENTAL_TERMS = [
  '1. يقر المستأجر بأنه استلم السيارة الموضحة أعلاه بحالة ميكانيكية وهيكلية ممتازة، ويتعهد بإعادتها بنفس الحالة والوقود في الموعد المحدد.',
  '2. يتحمل المستأجر المسؤولية الجنائية والمدنية الكاملة عن أي مخالفات مرورية أو حوادث أو استخدام مخالف للقوانين المصرية أثناء فترة العقد.',
  '3. يلتزم المستأجر بعدم قيادة السيارة من قبل أي شخص غير مسجل في هذا العقد، ويحظر تأجيرها من الباطن أو السير بها في الطرق الوعرة.',
  '4. قواعد التأخير: في حال إبلاغ الشركة مسبقاً بالتأخير وموافقتها، تُحتسب كل ساعة زيادة بقيمة 200 ج.م/ساعة. أما في حال التأخير دون إبلاغ مسبق للشركة، فيتحمل المستأجر غرامة إيجار يوم كامل إضافي.',
];
const num = (value: number) => value.toLocaleString('ar-EG');
const deposits = { held: 'محتجز لدى الشركة', pending: 'قيد التسوية', refunded_full: 'مسترد بالكامل', refunded_partial: 'مسترد جزئيًا' };
function Facts({ rows }: { rows: [string, string | number | undefined][] }) {
  return <dl className="rd-facts">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === undefined || value === '' ? <span className="rd-blank" aria-label="يستكمل بالقلم" /> : <bdi>{value}</bdi>}</dd></div>)}</dl>;
}
export default function RentalContractDocument({ booking }: { booking: Booking }) {
  const details = booking.contractRecord?.details || {};
  const paid = details.rentPaidEGP === undefined || details.rentPaidEGP === '' ? undefined : Number(details.rentPaidEGP);
  return <article className="rental-document" dir="rtl" aria-label="عقد إيجار السيارة للطباعة">
    <style>{CONTRACT_DOCUMENT_STYLES}</style>
    <div className="rd-brand"><img src="/logonew.png" alt="شعار شركة اليمن والخليج" width={58} height={58} />
      <div className="rd-brand-name"><h1>شركة اليمن والخليج لتأجير السيارات</h1><p>YEMEN &amp; GULF LUXURY CAR RENTAL</p><p>القاهرة — جمهورية مصر العربية · هاتف: <bdi>{COMPANY_CONTACT.localPhone}</bdi></p></div>
      <div className="rd-reference"><span>رقم العقد</span><strong><bdi>{booking.bookingNumber}</bdi></strong><span>تاريخ التحرير: <bdi>{booking.createdAt}</bdi></span><p>{BOOKING_STATUS_LABELS[booking.status]}</p></div>
    </div>
    <h2 className="rd-title">عقد إيجار سيارة سياحية وسند تسليم واستلام رسمي</h2>
    <section className="rd-section"><h3>أولاً: بيانات المستأجر — الطرف الثاني</h3><Facts rows={[
      ['الاسم بالكامل', booking.customer.fullName], ['الجنسية', booking.customer.nationality || 'مصري'], [details.secondaryPhone ? 'الهاتف الأساسي / الإضافي' : 'رقم الهاتف', [booking.customer.phone, details.secondaryPhone].filter(Boolean).join(' / ')],
      ['الرقم القومي / جواز السفر', booking.customer.nationalId], ['رخصة القيادة', booking.customer.licenseNumber], ['الموظف المسؤول', booking.staffName],
      ['عنوان المنزل', details.tenantAddress], ['عنوان العمل', details.workAddress], ['جهة إصدار الهوية / المحافظة', [details.idIssuer, details.governorate].filter(Boolean).join(' · ')],
      ['نوع الرخصة / جهة الإصدار', [details.licenseType, details.licenseIssuer].filter(Boolean).join(' · ')], ['إصدار رخصة القيادة', details.licenseIssuedAt], ['انتهاء رخصة القيادة', details.licenseExpiresAt],
    ]} /></section>
    <section className="rd-section"><h3>ثانيًا: المركبة وفترة الاستئجار</h3><Facts rows={[
      ['السيارة والموديل', booking.carName], ['رقم اللوحة', booking.carPlate], ['مدة الإيجار', num(booking.daysCount) + ' أيام'],
      ['تاريخ ووقت الاستلام', booking.startDate + ' · ' + booking.startTime], ['تاريخ ووقت الإرجاع', booking.endDate + ' · ' + booking.endTime], ['الإرجاع الفعلي', booking.actualReturnDate],
      ['عداد الخروج', num(booking.startKm) + ' كم'], ['عداد العودة', booking.returnKm === undefined ? undefined : num(booking.returnKm) + ' كم'], ['سنة الموديل / اللون', [details.carYear, details.carColor].filter(Boolean).join(' · ')],
      ['رقم الشاسيه', details.vin], ['رقم الموتور', details.engineNumber], ['الوقود عند التسليم / العودة', [details.handoverFuel, details.returnFuel].filter(Boolean).join(' / ')],
    ]} /></section>
    <section className="rd-section"><h3>السائق الإضافي المصرّح له — إن وجد</h3><Facts rows={[
      ['اسم السائق', details.driverName], ['العنوان', details.driverAddress], ['الهوية / جواز السفر', details.driverNationalId],
      ['رقم رخصة القيادة', details.driverLicenseNumber], ['نوعها / جهة الإصدار', [details.driverLicenseType, details.driverLicenseIssuer].filter(Boolean).join(' · ')], ['إصدار / انتهاء الرخصة', [details.driverLicenseIssuedAt, details.driverLicenseExpiresAt].filter(Boolean).join(' / ')],
    ]} /></section>
    <section className="rd-section"><h3>ثالثًا: الحساب المالي وسند التأمين — الجنيه المصري</h3>
      <table><thead><tr><th scope="col">البيان</th><th scope="col">المدة</th><th scope="col">سعر اليوم</th><th scope="col">المبلغ</th></tr></thead><tbody>
        <tr><td>إيجار {booking.carName}</td><td>{num(booking.daysCount)} أيام</td><td>{num(booking.dailyRateEGP)}</td><td>{num(booking.totalRentEGP)} ج.م</td></tr>
        {booking.discountAmountEGP > 0 && <tr><td>خصم معتمد {booking.discountCode && <bdi>({booking.discountCode})</bdi>}</td><td>—</td><td>—</td><td>−{num(booking.discountAmountEGP)} ج.م</td></tr>}
        <tr className="rd-total"><td colSpan={3}>صافي مبلغ الإيجار</td><td>{num(booking.finalTotalEGP)} ج.م</td></tr>
      </tbody></table>
      <Facts rows={[
        ['المدفوع من الإيجار حسب إيصال السداد', paid === undefined ? undefined : num(paid) + ' ج.م'],
        ['المتبقي من الإيجار', paid === undefined ? undefined : num(Math.max(0, booking.finalTotalEGP - paid)) + ' ج.م'],
        ['التأمين منفصل عن الإيجار', num(booking.securityDepositEGP) + ' ج.م'],
      ]} />
      <div className="rd-deposit"><div><strong>سند كفالة تأمين مسترد</strong><p>يُرد هذا المبلغ كاملاً للمستأجر فور تسليم السيارة وفحص سلامتها ومطابقة الكيلومترات والوقود.</p><p>حالة التأمين: {deposits[booking.depositStatus]}</p></div><strong>{num(booking.securityDepositEGP)} ج.م</strong></div>
    </section>
    <section className="rd-terms"><h3>الشروط والأحكام العامة وقواعد التأخير</h3>{RENTAL_TERMS.map((term) => <p key={term}>{term}</p>)}</section>
    {(booking.notes || details.conditionNotes) && <section className="rd-notes"><h3>ملاحظات العقد وحالة السيارة عند التسليم</h3><p>{[details.conditionNotes, booking.notes].filter(Boolean).join(' · ')}</p></section>}
    <div className="rd-signatures"><div><p>توقيع المستأجر بالقلم — الموافقة والاستلام</p><div className="rd-signature-line" /><strong>{booking.customer.fullName}</strong><p>التاريخ: ____ / ____ / ______</p></div><div><p>توقيع وختم الشركة — الطرف الأول</p><div className="rd-signature-line" /><strong>المسؤول: {booking.staffName}</strong><p>التاريخ: ____ / ____ / ______</p></div></div>
  </article>;
}
