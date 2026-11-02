// Fake records only: used for isolated rendering and print regression checks.
export const contractFixture = {
  id: 'test-contract', bookingNumber: 'TEST-2026-A4', carId: 'test-car', carName: 'Toyota Camry 2026', carPlate: 'أ ب 1234',
  customer: { id: 'test-customer', fullName: 'عميل اختبار الطباعة', nationality: 'مصري', phone: '01000000000', nationalId: 'PASSPORT-TEST-2026', licenseNumber: 'LICENSE-TEST-2026' },
  startDate: '2026-10-27', startTime: '14:00', endDate: '2026-10-30', endTime: '14:00', daysCount: 3,
  dailyRateEGP: 1000, totalRentEGP: 3000, discountCode: 'TEST', discountAmountEGP: 150, finalTotalEGP: 2850, securityDepositEGP: 10000,
  depositStatus: 'held', startKm: 12000, status: 'active', staffId: 'test-staff', staffName: 'موظف اختبار', createdAt: '2026-10-27',
  notes: 'ملاحظات تجريبية للتحقق من تنسيق العقد فقط.',
  contractRecord: { revision: 'test-revision', updatedAt: '2026-10-28', updatedBy: 'موظف اختبار', attachments: [], details: {
    secondaryPhone: '01111111111',
    tenantAddress: 'القاهرة — عنوان منزل تجريبي', workAddress: 'القاهرة — عنوان عمل تجريبي', idIssuer: 'مصلحة الأحوال المدنية', governorate: 'القاهرة',
    licenseType: 'خاصة', licenseIssuer: 'مرور القاهرة', licenseIssuedAt: '2025-01-01', licenseExpiresAt: '2030-01-01',
    carYear: '2026', carColor: 'أبيض', vin: 'TEST-VIN-2026', engineNumber: 'TEST-ENGINE-2026', handoverFuel: 'ممتلئ',
    driverName: 'سائق إضافي تجريبي', driverAddress: 'عنوان السائق التجريبي', driverNationalId: 'TEST-DRIVER-ID', driverLicenseNumber: 'TEST-DRIVER-LICENSE', driverLicenseType: 'خاصة', driverLicenseIssuer: 'مرور القاهرة', driverLicenseIssuedAt: '2025-01-01', driverLicenseExpiresAt: '2030-01-01',
    rentPaidEGP: '2000', conditionNotes: 'فحص تجريبي: تُوثّق حالة السيارة وتجهيزاتها قبل التسليم.',
  } },
};
