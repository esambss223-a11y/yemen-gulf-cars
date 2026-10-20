-- ========================================================
-- سكربت قاعدة بيانات يمن الخليج لتأجير السيارات (Supabase Schema)
-- ========================================================
BEGIN;

-- 1. جدول ملاك السيارات والشركاء (owners)
CREATE TABLE IF NOT EXISTS public.owners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  national_id TEXT,
  bank_account TEXT,
  commission_model TEXT DEFAULT 'fixed_monthly',
  owner_share_percent NUMERIC DEFAULT 75,
  fixed_daily_rate_egp NUMERIC DEFAULT 0,
  fixed_monthly_rate_egp NUMERIC DEFAULT 0,
  monthly_payout_day INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. جدول أسطول السيارات (cars)
CREATE TABLE IF NOT EXISTS public.cars (
  id TEXT PRIMARY KEY,
  car_code TEXT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT DEFAULT 'vip',
  plate_number TEXT NOT NULL,
  vin TEXT,
  color TEXT DEFAULT 'أسود ملكي',
  current_km INTEGER DEFAULT 0,
  initial_handover_km INTEGER DEFAULT 0,
  fleet_entry_date TEXT,
  contract_start_date TEXT,
  contract_end_date TEXT,
  license_expiry_date TEXT,
  license_renewal_date TEXT,
  next_service_km INTEGER,
  next_service_date TEXT,
  service_responsible_party TEXT DEFAULT 'company',
  daily_price_egp NUMERIC NOT NULL,
  weekly_price_egp NUMERIC,
  monthly_price_egp NUMERIC,
  security_deposit_egp NUMERIC DEFAULT 10000,
  status TEXT DEFAULT 'available', -- available, rented, maintenance, cleaning
  images JSONB DEFAULT '["/car-mercedes.jpg"]'::jsonb,
  cover_image TEXT DEFAULT '/car-mercedes.jpg',
  transmission TEXT DEFAULT 'automatic',
  fuel_type TEXT DEFAULT 'petrol',
  seats INTEGER DEFAULT 5,
  ownership TEXT DEFAULT 'company', -- company, investor
  owner_id TEXT REFERENCES public.owners(id) ON DELETE SET NULL,
  owner_name TEXT,
  owner_compensation_type TEXT DEFAULT 'fixed_monthly',
  owner_agreed_rate_egp NUMERIC DEFAULT 0,
  features JSONB DEFAULT '["مكيف فائق", "مقاعد جلد فاخرة"]'::jsonb,
  insurance_expiry_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. جدول الحجوزات والعقود (bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  booking_number TEXT NOT NULL UNIQUE,
  car_id TEXT REFERENCES public.cars(id) ON DELETE CASCADE,
  car_name TEXT NOT NULL,
  car_plate TEXT NOT NULL,
  customer JSONB NOT NULL, -- { id, fullName, phone, whatsapp, nationalId, licenseNumber }
  start_date TEXT NOT NULL,
  start_time TEXT DEFAULT '14:00',
  end_date TEXT NOT NULL,
  end_time TEXT DEFAULT '14:00',
  actual_return_date TEXT,
  days_count INTEGER NOT NULL DEFAULT 1,
  daily_rate_egp NUMERIC NOT NULL,
  total_rent_egp NUMERIC NOT NULL,
  discount_code TEXT,
  discount_amount_egp NUMERIC DEFAULT 0,
  final_total_egp NUMERIC NOT NULL,
  security_deposit_egp NUMERIC NOT NULL,
  deposit_status TEXT DEFAULT 'held', -- held, refunded_full, refunded_partial, pending
  start_km INTEGER NOT NULL DEFAULT 0,
  return_km INTEGER,
  status TEXT DEFAULT 'active', -- confirmed, active, completed, cancelled
  staff_id TEXT DEFAULT 'online',
  staff_name TEXT DEFAULT 'النظام',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. جدول الفواتير (invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  car_details TEXT NOT NULL,
  total_amount_egp NUMERIC NOT NULL,
  deposit_amount_egp NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  paid BOOLEAN DEFAULT true,
  issued_at TEXT NOT NULL,
  issued_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. جدول أكواد الخصم والعروض (coupons)
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT DEFAULT 'percentage', -- percentage, fixed_egp
  discount_value NUMERIC NOT NULL,
  expires_at TEXT NOT NULL,
  max_usage INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. جدول سجل الرقابة والأمان (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  staff_role TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. جدول العملاء وسجل CRM الرقمي (customers)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  national_id TEXT NOT NULL,
  license_number TEXT NOT NULL,
  nationality TEXT DEFAULT 'مصري',
  tier TEXT DEFAULT 'regular', -- vip_gold, vip_silver, regular, blacklist
  risk_status TEXT DEFAULT 'safe', -- safe, medium, high_risk
  trust_score INTEGER DEFAULT 90,
  star_rating NUMERIC DEFAULT 5,
  rating_count INTEGER DEFAULT 1,
  cleanliness_score TEXT DEFAULT 'clean',
  damages_count INTEGER DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  total_rentals_count INTEGER DEFAULT 0,
  total_spent_egp NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- سياسات الأمان والحماية (Row Level Security - RLS)
-- 7. جدول تتبع زوار الموقع الحقيقيين (site_visits)
CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visited_at TIMESTAMPTZ DEFAULT now(),
  page_path TEXT DEFAULT '/',
  device_type TEXT DEFAULT 'desktop', -- mobile, tablet, desktop
  session_id TEXT NOT NULL,
  created_date DATE DEFAULT CURRENT_DATE
);

-- 8. جدول دليل الموظفين المرتبط بحسابات المصادقة (staff directory)
-- كل سجل مرتبط بحساب في auth.users — لا يمكن تسجيل الدخول إلا لمن يوجد له سجل هنا
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'rental_agent', -- super_admin, rental_agent, accountant
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- سياسات الأمان وتصاريح الجداول (Row Level Security - RLS)
-- دالة تفويض موحدة (تُنشأ أولاً لتفادي أي خطأ)
CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = auth.uid() AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.has_staff_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = auth.uid() AND active = true AND role = ANY(allowed_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_staff() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_staff_role(TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_staff_role(TEXT[]) TO authenticated;

ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- استبدال كل السياسات الموجودة على جداول التطبيق بسياسات أدوار محددة.
-- الوصول الإداري للجدول staff يتم عبر Route Handlers باستخدام مفتاح الخادم فقط.
DO $$
DECLARE
  target_table TEXT;
  existing_policy RECORD;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'cars', 'owners', 'bookings', 'invoices', 'coupons',
    'audit_logs', 'customers', 'site_visits', 'staff'
  ] LOOP
    FOR existing_policy IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', existing_policy.policyname, target_table);
    END LOOP;
  END LOOP;
END $$;

REVOKE ALL ON TABLE public.cars, public.owners, public.bookings, public.invoices,
  public.coupons, public.audit_logs, public.customers, public.site_visits, public.staff
  FROM PUBLIC, anon, authenticated;

-- الموظفون الموثقون يمرون إلى RLS؛ سياسات كل جدول تحدد دورهم المسموح.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cars, public.owners,
  public.bookings, public.invoices, public.coupons, public.audit_logs,
  public.customers, public.site_visits TO authenticated;
GRANT SELECT (id, name, username, role, phone, active, created_at)
  ON TABLE public.staff TO authenticated;
CREATE POLICY "Staff read own profile" ON public.staff
  FOR SELECT TO authenticated USING (id = auth.uid());

-- صلاحيات الموقع العام: عرض السيارات المتاحة فقط، وإنشاء طلب حجز/عميل وزيارة.
-- لا توجد صلاحية عامة لقراءة الحجوزات أو بيانات العملاء أو الملاك أو الفواتير.
GRANT SELECT (id, make, model, year, category, plate_number, color,
  daily_price_egp, weekly_price_egp, monthly_price_egp, security_deposit_egp,
  status, images, cover_image, transmission, fuel_type, seats, ownership, features)
  ON TABLE public.cars TO anon;
GRANT INSERT (id, booking_number, car_id, car_name, car_plate, customer,
  start_date, start_time, end_date, end_time, days_count, daily_rate_egp,
  total_rent_egp, discount_code, discount_amount_egp, final_total_egp,
  security_deposit_egp, deposit_status, start_km, status, staff_id, staff_name, notes)
  ON TABLE public.bookings TO anon;
GRANT INSERT (id, full_name, phone, whatsapp, national_id, license_number,
  nationality, tier, risk_status, trust_score, star_rating, rating_count,
  cleanliness_score, damages_count, loyalty_points, total_rentals_count,
  total_spent_egp, notes) ON TABLE public.customers TO anon;
GRANT INSERT (page_path, device_type, session_id) ON TABLE public.site_visits TO anon;

CREATE POLICY "Public read available cars" ON public.cars
  FOR SELECT TO anon USING (status = 'available');
CREATE POLICY "Staff read cars" ON public.cars
  FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'rental_agent', 'accountant']));
CREATE POLICY "Managers create cars" ON public.cars
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(ARRAY['super_admin']));
CREATE POLICY "Managers update cars" ON public.cars
  FOR UPDATE TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin']))
  WITH CHECK (public.has_staff_role(ARRAY['super_admin']));
CREATE POLICY "Managers delete cars" ON public.cars
  FOR DELETE TO authenticated USING (public.has_staff_role(ARRAY['super_admin']));

CREATE POLICY "Staff read bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'rental_agent', 'accountant']));
CREATE POLICY "Staff create bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'rental_agent']));
CREATE POLICY "Staff update bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'rental_agent']))
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'rental_agent']));
CREATE POLICY "Managers delete bookings" ON public.bookings
  FOR DELETE TO authenticated USING (public.has_staff_role(ARRAY['super_admin']));
CREATE POLICY "Public submit booking request" ON public.bookings
  FOR INSERT TO anon
  WITH CHECK (
    status = 'active' AND deposit_status = 'pending'
    AND staff_id = 'online-portal' AND staff_name = 'بوابة الحجز الإلكتروني'
  );

CREATE POLICY "Staff read customers" ON public.customers
  FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'rental_agent', 'accountant']));
CREATE POLICY "Staff create customers" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'rental_agent']));
CREATE POLICY "Staff update customers" ON public.customers
  FOR UPDATE TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'rental_agent']))
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'rental_agent']));
CREATE POLICY "Managers delete customers" ON public.customers
  FOR DELETE TO authenticated USING (public.has_staff_role(ARRAY['super_admin']));
CREATE POLICY "Public submit booking customer" ON public.customers
  FOR INSERT TO anon
  WITH CHECK (national_id = 'طلب حجز إلكتروني' AND license_number = 'طلب حجز إلكتروني');

CREATE POLICY "Accountants and managers read owners" ON public.owners
  FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'accountant']));
CREATE POLICY "Managers create owners" ON public.owners
  FOR INSERT TO authenticated WITH CHECK (public.has_staff_role(ARRAY['super_admin']));
CREATE POLICY "Managers update owners" ON public.owners
  FOR UPDATE TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin']))
  WITH CHECK (public.has_staff_role(ARRAY['super_admin']));
CREATE POLICY "Managers delete owners" ON public.owners
  FOR DELETE TO authenticated USING (public.has_staff_role(ARRAY['super_admin']));

CREATE POLICY "Accountants and managers read invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'accountant']));
CREATE POLICY "Staff create invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'rental_agent', 'accountant']));
CREATE POLICY "Accountants update invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'accountant']))
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'accountant']));
CREATE POLICY "Managers delete invoices" ON public.invoices
  FOR DELETE TO authenticated USING (public.has_staff_role(ARRAY['super_admin']));

CREATE POLICY "Staff read coupons" ON public.coupons
  FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'rental_agent', 'accountant']));
CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT TO anon USING (active = true);
CREATE POLICY "Managers create coupons" ON public.coupons
  FOR INSERT TO authenticated WITH CHECK (public.has_staff_role(ARRAY['super_admin']));
CREATE POLICY "Managers update coupons" ON public.coupons
  FOR UPDATE TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin']))
  WITH CHECK (public.has_staff_role(ARRAY['super_admin']));
CREATE POLICY "Managers delete coupons" ON public.coupons
  FOR DELETE TO authenticated USING (public.has_staff_role(ARRAY['super_admin']));

CREATE POLICY "Managers read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.has_staff_role(ARRAY['super_admin']));
CREATE POLICY "Staff append audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'rental_agent', 'accountant']));

CREATE POLICY "Managers read site visits" ON public.site_visits
  FOR SELECT TO authenticated USING (public.has_staff_role(ARRAY['super_admin']));
CREATE POLICY "Public append site visits" ON public.site_visits
  FOR INSERT TO anon WITH CHECK (length(session_id) BETWEEN 8 AND 128);
CREATE POLICY "Staff append site visits" ON public.site_visits
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'rental_agent', 'accountant']));

-- ========================================================
-- بيانات أولية افتراضية للمشروع (Seed Data)
-- ========================================================
INSERT INTO public.owners (id, name, phone, commission_model, owner_share_percent, notes)
VALUES 
  ('owner-1', 'شركة يمن الخليج (أسطول الشركة)', '+20 100 123 4567', 'percentage', 100, 'السيارات المملوكة للشركة مباشرة'),
  ('owner-2', 'الشيخ عبد الله بن منصور (مستثمر)', '+20 111 222 3333', 'percentage', 75, 'عقد مشاركة أرباح VIP بنسبة 75%')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cars (id, make, model, year, category, plate_number, color, current_km, daily_price_egp, weekly_price_egp, security_deposit_egp, status, images, cover_image, ownership, owner_id, owner_name)
VALUES
  ('car-1', 'Mercedes-Benz', 'S-Class S500', 2024, 'vip', 'م ص ر 1928', 'أسود ملكي فاخر', 14200, 8500, 55000, 15000, 'available', '["/car-mercedes.jpg"]'::jsonb, '/car-mercedes.jpg', 'investor', 'owner-2', 'الشيخ عبد الله بن منصور (مستثمر)'),
  ('car-2', 'Range Rover', 'Autobiography LWB', 2024, 'suv', 'ق هـ ر 7741', 'أبيض لؤلؤي مع سقف أسود', 22100, 12000, 78000, 20000, 'rented', '["/car-rangerover.jpg"]'::jsonb, '/car-rangerover.jpg', 'company', 'owner-1', 'شركة يمن الخليج (أسطول الشركة)'),
  ('car-3', 'Nissan', 'Patrol Platinum V8', 2024, 'suv', 'ج ي ز 5502', 'رمادي تيتانيوم', 31000, 6500, 42000, 10000, 'available', '["/car-nissan.jpg"]'::jsonb, '/car-nissan.jpg', 'company', 'owner-1', 'شركة يمن الخليج (أسطول الشركة)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.coupons (id, code, discount_type, discount_value, expires_at, max_usage, used_count, active)
VALUES
  ('cp-1', 'VIP2026', 'fixed_egp', 5000, '2026-12-31', 50, 7, true),
  ('cp-2', 'GULF10', 'percentage', 10, '2026-11-30', 100, 14, true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
