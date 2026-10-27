// Fake records only: used for isolated rendering and print regression checks.
export const contractFixture = {
  id: 'test-contract', bookingNumber: 'TEST-2026-A4', carId: 'test-car', carName: 'Toyota Camry 2026', carPlate: 'أ ب 1234',
  customer: { id: 'test-customer', fullName: 'عميل اختبار الطباعة', nationality: 'مصري', phone: '01000000000', nationalId: 'PASSPORT-TEST-2026', licenseNumber: 'LICENSE-TEST-2026' },
  startDate: '2026-10-27', startTime: '14:00', endDate: '2026-10-30', endTime: '14:00', daysCount: 3,
  dailyRateEGP: 1000, totalRentEGP: 3000, discountCode: 'TEST', discountAmountEGP: 150, finalTotalEGP: 2850, securityDepositEGP: 10000,
  depositStatus: 'held', startKm: 12000, status: 'active', staffId: 'test-staff', staffName: 'موظف اختبار', createdAt: '2026-10-27',
  notes: 'ملاحظات تجريبية للتحقق من تنسيق العقد فقط.',
};
