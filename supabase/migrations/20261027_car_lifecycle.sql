-- Additive: preserves every existing car, booking, invoice and staff account.
BEGIN;

CREATE OR REPLACE FUNCTION public.guard_car_removal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.bookings WHERE car_id = OLD.id) THEN
      RAISE EXCEPTION 'CAR_HAS_HISTORY';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'archived' AND NEW.status IS DISTINCT FROM 'archived'
    AND current_setting('ygcar.lifecycle_action', true) IS DISTINCT FROM 'restore' THEN
    RAISE EXCEPTION 'CAR_ARCHIVED';
  END IF;
  IF NEW.status = 'archived' AND OLD.status IS DISTINCT FROM 'archived'
    AND EXISTS (SELECT 1 FROM public.bookings WHERE car_id = OLD.id
      AND (status IS NULL OR status NOT IN ('completed', 'cancelled'))) THEN
    RAISE EXCEPTION 'CAR_HAS_OPEN_BOOKINGS';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_car_removal ON public.cars;
CREATE TRIGGER guard_car_removal BEFORE UPDATE OF status OR DELETE ON public.cars
FOR EACH ROW EXECUTE FUNCTION public.guard_car_removal();

CREATE OR REPLACE FUNCTION public.guard_archived_car_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status text;
BEGIN
  -- Same row lock as archiving and public booking: concurrent requests serialize.
  SELECT status INTO v_status FROM public.cars WHERE id = NEW.car_id FOR UPDATE;
  IF v_status = 'archived' AND (NEW.status IS NULL OR NEW.status NOT IN ('completed', 'cancelled')) THEN
    RAISE EXCEPTION 'CAR_ARCHIVED';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_archived_car_booking ON public.bookings;
CREATE TRIGGER guard_archived_car_booking BEFORE INSERT OR UPDATE OF car_id, status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_archived_car_booking();

CREATE OR REPLACE FUNCTION public.fleet_car_action(
  p_actor uuid, p_car_id text, p_action text,
  p_booking_id text DEFAULT NULL, p_reason text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_car public.cars%ROWTYPE; v_booking public.bookings%ROWTYPE;
  v_staff public.staff%ROWTYPE; v_label text;
BEGIN
  SELECT * INTO v_staff FROM public.staff WHERE id = p_actor AND active IS TRUE AND role = 'super_admin';
  IF NOT FOUND THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  SELECT * INTO v_car FROM public.cars WHERE id = p_car_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CAR_NOT_FOUND'; END IF;
  IF p_action = 'cancel_booking' THEN
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND car_id = p_car_id FOR UPDATE;
    IF NOT FOUND OR v_booking.status NOT IN ('pending_approval', 'confirmed') OR v_booking.status IS NULL THEN
      RAISE EXCEPTION 'BOOKING_NOT_CANCELLABLE';
    END IF;
    IF length(trim(coalesce(p_reason, ''))) NOT BETWEEN 3 AND 300 THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
    IF (v_booking.security_deposit_egp > 0 AND v_booking.deposit_status IN ('held', 'refunded_partial'))
      OR EXISTS (SELECT 1 FROM public.invoices WHERE booking_id = v_booking.id AND paid IS TRUE
        AND (total_amount_egp > 0 OR deposit_amount_egp > 0)) THEN
      RAISE EXCEPTION 'SETTLEMENT_REQUIRED';
    END IF;
    UPDATE public.bookings SET status = 'cancelled',
      notes = concat_ws(E'\n', nullif(notes, ''), 'إلغاء بواسطة ' || v_staff.name || ': ' || trim(p_reason))
      WHERE id = v_booking.id RETURNING * INTO v_booking;
    IF nullif(trim(v_booking.discount_code), '') IS NOT NULL THEN
      UPDATE public.coupons SET used_count = greatest(0, used_count - 1) WHERE code = v_booking.discount_code;
    END IF;
    v_label := 'إلغاء حجز قبل التسليم';
  ELSIF p_action = 'archive' THEN
    UPDATE public.cars SET status = 'archived' WHERE id = p_car_id RETURNING * INTO v_car;
    -- The trigger checks all open bookings, including overdue and pending requests.
    v_label := 'أرشفة سيارة';
  ELSIF p_action = 'restore' THEN
    IF v_car.status <> 'archived' THEN RAISE EXCEPTION 'CAR_NOT_ARCHIVED'; END IF;
    PERFORM set_config('ygcar.lifecycle_action', 'restore', true);
    UPDATE public.cars SET status = 'maintenance' WHERE id = p_car_id RETURNING * INTO v_car;
    PERFORM set_config('ygcar.lifecycle_action', '', true);
    v_label := 'إعادة سيارة من الأرشيف للصيانة والفحص';
  ELSIF p_action = 'delete' THEN
    DELETE FROM public.cars WHERE id = p_car_id;
    v_label := 'حذف سيارة بلا سجلات';
  ELSE RAISE EXCEPTION 'INVALID_ACTION';
  END IF;
  INSERT INTO public.audit_logs(id, action, staff_name, staff_role, timestamp, details)
    VALUES (gen_random_uuid()::text, v_label, v_staff.name, v_staff.role, now()::text,
      concat_ws(' — ', v_car.make || ' ' || v_car.model, v_car.plate_number, v_booking.booking_number, nullif(trim(p_reason), '')));
  RETURN jsonb_build_object('car', to_jsonb(v_car), 'booking', CASE WHEN v_booking.id IS NOT NULL THEN to_jsonb(v_booking) ELSE NULL END,
    'deleted', p_action = 'delete');
END $$;
REVOKE ALL ON FUNCTION public.fleet_car_action(uuid,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fleet_car_action(uuid,text,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.guard_car_removal(), public.guard_archived_car_booking() FROM PUBLIC, anon, authenticated;
COMMIT;
