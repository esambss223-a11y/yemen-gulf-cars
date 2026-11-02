import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadUiModule } from './load-ui-module.mjs';

const { getAdminSections, getAdminSectionTitle, getStaffRoleLabel } = loadUiModule('components/admin/admin-navigation.ts');
const staff = { id: 'fixture-staff', name: 'موظف تجريبي', role: 'super_admin', maintenanceAccess: false };

test('the new shared navigation preserves existing role boundaries', () => {
  assert.deepEqual(Array.from(getAdminSections(staff), item => item.id), ['overview', 'cars', 'bookings', 'customers', 'owners', 'staff', 'coupons', 'audit', 'profile']);
  assert.deepEqual(Array.from(getAdminSections({ ...staff, role: 'rental_agent' }), item => item.id), ['overview', 'cars', 'bookings', 'customers', 'profile']);
  assert.deepEqual(Array.from(getAdminSections({ ...staff, role: 'accountant' }), item => item.id), ['overview', 'cars', 'bookings', 'customers', 'profile']);
  assert.deepEqual(Array.from(getAdminSections({ ...staff, role: 'fleet_entry' }), item => item.id), ['cars', 'profile']);
});

test('developer labels do not expand the staff role navigation', () => {
  const developer = { ...staff, maintenanceAccess: true };
  assert.equal(getAdminSectionTitle('overview', developer), 'مركز المبرمج');
  assert.equal(getStaffRoleLabel(developer), 'مبرمج النظام');
  assert.equal(getAdminSections(developer).length, getAdminSections(staff).length);
  assert.equal(getAdminSections({ ...developer, role: 'rental_agent' }).some(item => item.id === 'staff'), false);
});

test('header keeps search labelled and exposes creation only to the existing roles', () => {
  const Header = loadUiModule('components/admin/AdminHeader.tsx', { '@/lib/supabase': { supabase: {} } }).default;
  const props = { activeTab: 'cars', searchQuery: '', setSearchQuery() {}, isCloudConnected: true, currentStaff: staff, onOpenAddBooking() {}, onOpenAddCar() {}, onOpenTab() {}, onOpenProfile() {}, onLogout() {} };
  const admin = renderToStaticMarkup(React.createElement(Header, props));
  assert.match(admin, /البحث في بيانات القسم الحالي/);
  assert.match(admin, /aria-controls="admin-create-panel"/);
  assert.match(admin, /aria-label="حساب موظف تجريبي"/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Header, { ...props, currentStaff: { ...staff, role: 'accountant' } })), /aria-controls="admin-create-panel"/);
});
