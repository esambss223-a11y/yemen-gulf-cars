-- Adds duration prices only; existing cars, accounts and contracts are retained.
begin;
create or replace function public.valid_car_duration_prices(value jsonb)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare item jsonb; days numeric; price numeric; seen integer[] := '{}';
begin
  if value is null then return true; end if;
  if jsonb_typeof(value) <> 'array' then return false; end if;
  if jsonb_array_length(value) > 20 then return false; end if;
  for item in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'days') is distinct from 'number' or jsonb_typeof(item->'totalEGP') is distinct from 'number' then return false; end if;
    days := (item->>'days')::numeric; price := (item->>'totalEGP')::numeric;
    if days <> trunc(days) or days < 2 or days > 365 or days in (7,30) or days::integer = any(seen) or price <= 0 or price > 100000000 or price <> round(price,2) then return false; end if;
    seen := array_append(seen,days::integer);
  end loop;
  return true;
exception when others then return false;
end;
$$;
alter table public.cars add column if not exists rental_price_tiers jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.cars'::regclass and conname = 'cars_rental_price_tiers_valid') then
    alter table public.cars add constraint cars_rental_price_tiers_valid check (public.valid_car_duration_prices(rental_price_tiers));
  end if;
end $$;
notify pgrst, 'reload schema';
commit;
