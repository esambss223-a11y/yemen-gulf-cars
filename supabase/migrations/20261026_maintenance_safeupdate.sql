-- Fix compatibility with Supabase safeupdate. Installs a function only; does not execute reset.
BEGIN;
CREATE OR REPLACE FUNCTION public.maintenance_apply(
  operation_name TEXT, expected_fingerprint TEXT, expected_staff_fingerprint TEXT,
  ticket_id UUID, actor UUID, restore_data JSONB DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE before_state JSONB; after_state JSONB; affected_count INTEGER := 0; key_name TEXT;
BEGIN
  IF operation_name NOT IN ('reset', 'restore', 'repair') THEN RAISE EXCEPTION 'INVALID_OPERATION'; END IF;
  LOCK TABLE public.owners, public.cars, public.customers, public.coupons, public.bookings,
    public.invoices, public.site_visits, public.permission_requests, public.audit_logs IN SHARE ROW EXCLUSIVE MODE;
  LOCK TABLE public.staff IN SHARE MODE;
  PERFORM u.id FROM public.staff s JOIN auth.users u ON u.id = s.id
    WHERE s.id = actor AND s.active AND s.role = 'super_admin'
    AND u.raw_app_meta_data @> '{"maintenance_access": true}'::jsonb FOR SHARE OF u;
  IF NOT FOUND THEN RAISE EXCEPTION 'DEVELOPER_REQUIRED'; END IF;
  before_state := public.maintenance_snapshot();
  IF before_state->>'fingerprint' IS DISTINCT FROM expected_fingerprint OR
      before_state->>'staffFingerprint' IS DISTINCT FROM expected_staff_fingerprint THEN
    RAISE EXCEPTION 'DATA_CHANGED_RETRY_BACKUP';
  END IF;
  -- A ticket can be used once, including against an already empty database.
  INSERT INTO public.maintenance_events (id, actor_id, operation, affected) VALUES (ticket_id, actor, operation_name, 0);
  IF operation_name = 'restore' THEN
    IF restore_data IS NULL OR jsonb_typeof(restore_data) <> 'object' OR
      (SELECT count(*) FROM jsonb_object_keys(restore_data)) <> 9 THEN RAISE EXCEPTION 'INVALID_BACKUP'; END IF;
    FOREACH key_name IN ARRAY ARRAY['owners','cars','customers','coupons','bookings','invoices','site_visits','permission_requests','audit_logs'] LOOP
      IF jsonb_typeof(restore_data->key_name) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'INVALID_BACKUP'; END IF;
    END LOOP;
  END IF;
  IF operation_name IN ('reset', 'restore') THEN
    SELECT COALESCE(sum(jsonb_array_length(value)), 0)::integer INTO affected_count FROM jsonb_each(before_state->'data');
    -- Supabase safeupdate requires an explicit predicate, even for intentional resets.
    -- These primary keys are NOT NULL; only the nine approved business tables are reset.
    DELETE FROM public.invoices WHERE id IS NOT NULL;
    DELETE FROM public.bookings WHERE id IS NOT NULL;
    DELETE FROM public.cars WHERE id IS NOT NULL;
    DELETE FROM public.owners WHERE id IS NOT NULL;
    DELETE FROM public.customers WHERE id IS NOT NULL;
    DELETE FROM public.coupons WHERE id IS NOT NULL;
    DELETE FROM public.permission_requests WHERE id IS NOT NULL;
    DELETE FROM public.site_visits WHERE id IS NOT NULL;
    DELETE FROM public.audit_logs WHERE id IS NOT NULL;
    IF operation_name = 'restore' THEN
      INSERT INTO public.owners SELECT * FROM jsonb_populate_recordset(NULL::public.owners, restore_data->'owners');
      INSERT INTO public.cars SELECT * FROM jsonb_populate_recordset(NULL::public.cars, restore_data->'cars');
      INSERT INTO public.customers SELECT * FROM jsonb_populate_recordset(NULL::public.customers, restore_data->'customers');
      INSERT INTO public.coupons SELECT * FROM jsonb_populate_recordset(NULL::public.coupons, restore_data->'coupons');
      INSERT INTO public.bookings SELECT * FROM jsonb_populate_recordset(NULL::public.bookings, restore_data->'bookings');
      INSERT INTO public.invoices SELECT * FROM jsonb_populate_recordset(NULL::public.invoices, restore_data->'invoices');
      INSERT INTO public.site_visits SELECT * FROM jsonb_populate_recordset(NULL::public.site_visits, restore_data->'site_visits');
      INSERT INTO public.permission_requests SELECT * FROM jsonb_populate_recordset(NULL::public.permission_requests, restore_data->'permission_requests');
      INSERT INTO public.audit_logs SELECT * FROM jsonb_populate_recordset(NULL::public.audit_logs, restore_data->'audit_logs');
    END IF;
  ELSE
    -- Only fix the unambiguous mismatch; maintenance/cleaning cars are left alone.
    UPDATE public.cars c SET status = 'rented' WHERE c.status = 'available' AND EXISTS
      (SELECT 1 FROM public.bookings b WHERE b.car_id = c.id AND b.status = 'active');
    GET DIAGNOSTICS affected_count = ROW_COUNT;
  END IF;
  after_state := public.maintenance_snapshot();
  IF operation_name = 'reset' AND EXISTS (SELECT 1 FROM jsonb_each(after_state->'data') WHERE jsonb_array_length(value) <> 0) THEN
    RAISE EXCEPTION 'RESET_VERIFICATION_FAILED';
  END IF;
  IF after_state->>'staffFingerprint' IS DISTINCT FROM expected_staff_fingerprint THEN
    RAISE EXCEPTION 'STAFF_CHANGED_ROLLBACK';
  END IF;
  IF operation_name = 'restore' AND after_state->'data' IS DISTINCT FROM restore_data THEN
    RAISE EXCEPTION 'RESTORE_VERIFICATION_FAILED';
  END IF;
  UPDATE public.maintenance_events SET affected = affected_count WHERE id = ticket_id;
  RETURN jsonb_build_object('operation', operation_name, 'affected', affected_count, 'accountsPreserved', true);
END;
$$;
REVOKE ALL ON FUNCTION public.maintenance_apply(TEXT,TEXT,TEXT,UUID,UUID,JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.maintenance_apply(TEXT,TEXT,TEXT,UUID,UUID,JSONB) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
