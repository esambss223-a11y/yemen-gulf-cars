import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadUiModule } from './load-ui-module.mjs';

const { getAdminSections, getAdminSectionTitle, getStaffRoleLabel } = loadUiModule('components/admin/admin-navigation.ts');
const Header = loadUiModule('components/admin/AdminHeader.tsx', { '@/lib/supabase': { supabase: {} } }).default;
const CarDetailsView = loadUiModule('components/admin/tabs/CarDetailsView.tsx', {
  '@/lib/car-images': loadUiModule('lib/car-images.ts'),
  '@/lib/car-record': loadUiModule('lib/car-record.ts'),
  '@/lib/car-pricing': loadUiModule('lib/car-pricing.ts'),
}).default;

// Strix Security Auditing Suite
test('[STRIX-SEC-01] Owner data isolation: Accountant, Rental Agent, and Fleet Entry are strictly denied access to owners', () => {
  const superAdmin = { id: 'admin-1', name: 'المدير العام', role: 'super_admin', active: true };
  const accountant = { id: 'acc-1', name: 'المحاسب', role: 'accountant', active: true };
  const rentalAgent = { id: 'agent-1', name: 'موظف التأجير', role: 'rental_agent', active: true };
  const fleetEntry = { id: 'fleet-1', name: 'مسؤول الأسطول', role: 'fleet_entry', active: true };

  // 1. Navigation boundary check
  const adminSections = Array.from(getAdminSections(superAdmin), s => s.id);
  const accountantSections = Array.from(getAdminSections(accountant), s => s.id);
  const agentSections = Array.from(getAdminSections(rentalAgent), s => s.id);
  const fleetSections = Array.from(getAdminSections(fleetEntry), s => s.id);

  assert.ok(adminSections.includes('owners'), 'Super admin must have access to owners');
  assert.ok(!accountantSections.includes('owners'), 'ACCOUNTANT VULNERABILITY PREVENTED: Accountant must NOT have access to owners');
  assert.ok(!agentSections.includes('owners'), 'Rental agent must NOT have access to owners');
  assert.ok(!fleetSections.includes('owners'), 'Fleet entry officer must NOT have access to owners');
});

test('[STRIX-SEC-02] Owner private data leak prevention: Sensitive coordinates are never exposed to non-super_admin staff', () => {
  const car = {
    id: 'car-secret-1',
    make: 'Mercedes-Benz',
    model: 'S500',
    year: 2024,
    category: 'vip',
    plateNumber: 'ق أ د 9999',
    color: 'أسود ملوكي',
    currentKm: 15000,
    dailyPriceEGP: 8000,
    securityDepositEGP: 20000,
    status: 'available',
    images: [],
    coverImage: '/car-mercedes.jpg',
    transmission: 'automatic',
    fuelType: 'petrol',
    seats: 5,
    ownership: 'investor',
    ownerId: 'owner-top-secret',
    features: [],
  };

  const secretOwner = {
    id: 'owner-top-secret',
    name: 'سعادة الشريك المستثمر',
    phone: '01099999999',
    bankAccount: 'EG3800020001000000999999999',
    nationalId: '29001010199999',
    commissionModel: 'fixed_monthly',
    fixedMonthlyRateEGP: 45000,
    notes: 'حساب سري للغاية - تحويل في اليوم الأول من كل شهر',
  };

  const roles = [
    { role: 'accountant', name: 'محاسب الشركة' },
    { role: 'rental_agent', name: 'مسؤول التأجير' },
    { role: 'fleet_entry', name: 'مسؤول إدخال الأسطول' },
  ];

  for (const { role, name } of roles) {
    const rendered = renderToStaticMarkup(
      React.createElement(CarDetailsView, {
        car,
        owner: secretOwner,
        bookings: [],
        currentStaff: { id: `staff-${role}`, name, role, active: true },
        onClose() {},
        onEdit() {},
        onOpenContract() {},
      })
    );

    // Private owner details MUST NOT be rendered for any non-super_admin role
    assert.ok(!rendered.includes('01099999999'), `SECURITY LEAK: Owner phone leaked to ${role}`);
    assert.ok(!rendered.includes('EG3800020001000000999999999'), `SECURITY LEAK: Owner bank account leaked to ${role}`);
    assert.ok(!rendered.includes('29001010199999'), `SECURITY LEAK: Owner national ID leaked to ${role}`);
    assert.ok(!rendered.includes('حساب سري للغاية'), `SECURITY LEAK: Owner internal notes leaked to ${role}`);
    assert.ok(!rendered.includes('بيانات المالك المالية'), `SECURITY LEAK: Owner financial block visible to ${role}`);
  }

  // But for super_admin, it is visible
  const superAdminRendered = renderToStaticMarkup(
    React.createElement(CarDetailsView, {
      car,
      owner: secretOwner,
      bookings: [],
      currentStaff: { id: 'admin-1', name: 'المدير العام', role: 'super_admin', active: true },
      onClose() {},
      onEdit() {},
      onOpenContract() {},
    })
  );

  assert.ok(superAdminRendered.includes('01099999999'), 'Super admin should see owner phone');
  assert.ok(superAdminRendered.includes('EG3800020001000000999999999'), 'Super admin should see owner bank account');
});

test('[STRIX-SEC-03] Fleet Entry least privilege enforcement: Only cars and profile, zero access to revenues, bookings, or customers', () => {
  const fleetEntry = { id: 'fleet-user-1', name: 'فني إدخال السيارات', role: 'fleet_entry', active: true };
  const sections = Array.from(getAdminSections(fleetEntry), s => s.id);

  assert.deepEqual(sections, ['cars', 'profile'], 'Fleet entry must be strictly bounded to cars and profile');
  assert.ok(!sections.includes('overview'), 'Revenues and financial analytics must remain blocked');
  assert.ok(!sections.includes('bookings'), 'Contracts and customer bookings must remain blocked');
  assert.ok(!sections.includes('customers'), 'Customer CRM records must remain blocked');
  assert.ok(!sections.includes('owners'), 'Owner investment accounts must remain blocked');
  assert.ok(!sections.includes('staff'), 'Staff governance must remain blocked');
  assert.ok(!sections.includes('audit'), 'System audit trail must remain blocked');

  // Verify role badge label
  assert.equal(getStaffRoleLabel(fleetEntry), 'مسؤول إدخال الأسطول');
});

test('[STRIX-SEC-04] Quick Action boundary: Fleet Entry can register cars, but CANNOT execute customer bookings', () => {
  const fleetStaff = { id: 'fleet-user-1', name: 'مسؤول الأسطول', role: 'fleet_entry', active: true };
  const props = {
    activeTab: 'cars',
    searchQuery: '',
    setSearchQuery() {},
    isCloudConnected: true,
    currentStaff: fleetStaff,
    onOpenAddBooking() {},
    onOpenAddCar() {},
    onOpenTab() {},
    onOpenProfile() {},
    onLogout() {},
  };

  const rendered = renderToStaticMarkup(React.createElement(Header, props));
  
  // Create panel exists for fleet_entry because canAddCar is true
  assert.match(rendered, /aria-controls="admin-create-panel"/);
  
  // But booking creation must NOT be exposed
  assert.doesNotMatch(rendered, /إبرام عقد إيجار جديد/);
});
