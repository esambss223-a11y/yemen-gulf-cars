BEGIN;
-- Nullable: old bookings and old maintenance JSON backups remain restorable.
-- One independent document field; no changes to amounts, accounts or booking state.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS contract_record jsonb;
COMMENT ON COLUMN public.bookings.contract_record IS 'Office paper-contract details, revision and private scan references. Files are stored separately in private Storage.';
-- Preserve existing booking permissions; protect only this new document field.
CREATE OR REPLACE FUNCTION public.guard_rental_contract_record()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    IF (TG_OP = 'INSERT' AND NEW.contract_record IS NOT NULL) OR
       (TG_OP = 'UPDATE' AND NEW.contract_record IS DISTINCT FROM OLD.contract_record) THEN
      RAISE EXCEPTION 'CONTRACT_SERVER_REQUIRED' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_rental_contract_record ON public.bookings;
CREATE TRIGGER guard_rental_contract_record BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_rental_contract_record();
NOTIFY pgrst, 'reload schema';
COMMIT;
