-- Tighten profile CRUD: users may only maintain their own profile.
-- A phone may be set once to the submitted provisional identity, then is immutable.
-- It remains explicitly unverified until WhatsApp verification is deployed.
drop policy if exists "profile insert own" on public.profiles;
create policy "profile insert own" on public.profiles
for insert to authenticated
with check (
  id = (select auth.uid())
  and phone = (select auth.jwt()->'user_metadata'->>'phone')
);

drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create or replace function public.prevent_trm_phone_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.phone is distinct from new.phone then
    if old.phone is not null
       or new.phone is distinct from (select auth.jwt()->'user_metadata'->>'phone') then
      raise exception 'Phone number cannot be changed without the verified account recovery process.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trm_profile_phone_immutable on public.profiles;
create trigger trm_profile_phone_immutable
before update of phone on public.profiles
for each row execute function public.prevent_trm_phone_change();

-- No customer-facing profile deletion. Account deletion is owner-controlled.
revoke delete on public.profiles from anon, authenticated;

-- Direct order/item inserts/deletes are denied. New orders must go through
-- place_order(), which validates profile, quantities, stock and payment method.
revoke insert, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
