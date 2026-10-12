-- ========================================================
-- سكربت قاعدة بيانات يمن الخليج لتأجير السيارات (Supabase Schema)
-- ========================================================

-- 1. جدول ملاك السيارات والشركاء (owners)
CREATE TABLE IF NOT EXISTS public.owners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  bank_account TEXT,
  commission_model TEXT DEFAULT 'percentage',
  owner_share_percent NUMERIC DEFAULT 75,
  fixed_daily_rate_egp NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. جدول أسطول السيارات (cars)
CREATE TABLE IF NOT EXISTS public.cars (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT DEFAULT 'vip',
  plate_number TEXT NOT NULL,
  vin TEXT,
  color TEXT DEFAULT 'أسود ملكي',
  current_km INTEGER DEFAULT 0,
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

-- ========================================================
-- سياسات الأمان والحماية (Row Level Security - RLS)
-- ========================================================
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة والإضافة لجميع العمليات المصرح بها
CREATE POLICY "Allow public read cars" ON public.cars FOR SELECT USING (true);
CREATE POLICY "Allow public write cars" ON public.cars FOR ALL USING (true);

CREATE POLICY "Allow public read owners" ON public.owners FOR SELECT USING (true);
CREATE POLICY "Allow public write owners" ON public.owners FOR ALL USING (true);

CREATE POLICY "Allow public read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow public write bookings" ON public.bookings FOR ALL USING (true);

CREATE POLICY "Allow public read invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public write invoices" ON public.invoices FOR ALL USING (true);

CREATE POLICY "Allow public read coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Allow public write coupons" ON public.coupons FOR ALL USING (true);

CREATE POLICY "Allow public read logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public write logs" ON public.audit_logs FOR ALL USING (true);

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
