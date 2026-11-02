-- Optional public display ordering. No bookings, users or prices are modified.
begin;
alter table public.cars add column if not exists display_order integer;
create or replace function public.fleet_save_car_order(p_ids text[])
returns void language plpgsql security invoker set search_path = pg_catalog, public as $$
declare current_ids text[];
begin
  -- Serialize full-list saves and lock the current fleet against archive/deletion.
  perform pg_advisory_xact_lock(731031);
  perform id from public.cars order by id for update;
  select coalesce(array_agg(id order by id), '{}'::text[]) into current_ids from public.cars where status <> 'archived';
  if p_ids is null or cardinality(p_ids) > 2000 or
    cardinality(p_ids) <> (select count(distinct x) from unnest(p_ids) x) or
    current_ids is distinct from (select coalesce(array_agg(x order by x), '{}'::text[]) from unnest(p_ids) x)
  then raise exception 'FLEET_CHANGED'; end if;
  update public.cars c set display_order = (o.position - 1)::integer
    from unnest(p_ids) with ordinality as o(id, position) where c.id = o.id;
end;
$$;
revoke all on function public.fleet_save_car_order(text[]) from public, anon, authenticated;
grant execute on function public.fleet_save_car_order(text[]) to service_role;
grant select (display_order) on table public.cars to anon;
notify pgrst, 'reload schema';
commit;
