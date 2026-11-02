-- Migration: Fleet Entry Role, Strict Owner Isolation, and Insurance Tracking
-- Additive & Non-destructive: preserves existing cars, bookings, invoices, and staff.
BEGIN;

-- 1. Ensure insurance column exists in public.cars
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS insurance_expiry_date TEXT;

-- 2. Update permission requests role constraint to allow fleet_entry
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'permission_requests_requested_role_check'
      AND conrelid = 'public.permission_requests'::regclass
  ) THEN
    ALTER TABLE public.permission_requests DROP CONSTRAINT permission_requests_requested_role_check;
  END IF;
  ALTER TABLE public.permission_requests
    ADD CONSTRAINT permission_requests_requested_role_check
    CHECK (requested_role IN ('super_admin', 'rental_agent', 'accountant', 'fleet_entry'));
END $$;

-- 3. Strict Owner Isolation at Database Level:
-- Drop old policy that allowed accountants to read owners
DROP POLICY IF EXISTS "Accountants and managers read owners" ON public.owners;
DROP POLICY IF EXISTS "Managers read owners" ON public.owners;

-- Only super_admin can read owners table in Supabase
CREATE POLICY "Managers read owners" ON public.owners
  FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin']));

-- 4. Grant Fleet Entry read and write permissions on Cars table
DROP POLICY IF EXISTS "Staff read cars" ON public.cars;
CREATE POLICY "Staff read cars" ON public.cars
  FOR SELECT TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'rental_agent', 'accountant', 'fleet_entry']));

DROP POLICY IF EXISTS "Managers create cars" ON public.cars;
DROP POLICY IF EXISTS "Fleet entry and managers create cars" ON public.cars;
CREATE POLICY "Fleet entry and managers create cars" ON public.cars
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'fleet_entry']));

DROP POLICY IF EXISTS "Managers update cars" ON public.cars;
DROP POLICY IF EXISTS "Fleet entry and managers update cars" ON public.cars;
CREATE POLICY "Fleet entry and managers update cars" ON public.cars
  FOR UPDATE TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin', 'fleet_entry']))
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'fleet_entry']));

-- 5. Allow fleet_entry to append audit logs and visits
DROP POLICY IF EXISTS "Staff append audit logs" ON public.audit_logs;
CREATE POLICY "Staff append audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'rental_agent', 'accountant', 'fleet_entry']));

DROP POLICY IF EXISTS "Staff append site visits" ON public.site_visits;
CREATE POLICY "Staff append site visits" ON public.site_visits
  FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(ARRAY['super_admin', 'rental_agent', 'accountant', 'fleet_entry']));

-- 6. Ensure car display order column, permissions, and save RPC function
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS display_order INTEGER;
GRANT SELECT (display_order) ON TABLE public.cars TO anon;

CREATE OR REPLACE FUNCTION public.fleet_save_car_order(p_ids text[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public AS $$
DECLARE current_ids text[];
BEGIN
  -- Serialize full-list saves and lock the current fleet against archive/deletion.
  PERFORM pg_advisory_xact_lock(731031);
  PERFORM id FROM public.cars ORDER BY id FOR UPDATE;
  SELECT coalesce(array_agg(id ORDER BY id), '{}'::text[]) INTO current_ids FROM public.cars WHERE status <> 'archived';
  IF p_ids IS NULL OR cardinality(p_ids) > 2000 OR
    cardinality(p_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_ids) x) OR
    current_ids IS DISTINCT FROM (SELECT coalesce(array_agg(x ORDER BY x), '{}'::text[]) FROM unnest(p_ids) x)
  THEN RAISE EXCEPTION 'FLEET_CHANGED'; END IF;
  UPDATE public.cars c SET display_order = (o.position - 1)::integer
    FROM unnest(p_ids) WITH ORDINALITY AS o(id, position) WHERE c.id = o.id;
END;
$$;
REVOKE ALL ON FUNCTION public.fleet_save_car_order(text[]) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fleet_save_car_order(text[]) TO service_role;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
