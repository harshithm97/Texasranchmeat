-- Tighten profile CRUD: customers may only maintain their own profile and may not
-- change the phone number associated with their provisional auth identity.
-- Phone is unverified until the future WhatsApp verification flow is deployed.
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
with check (
  id = (select auth.uid())
  and phone = (select auth.jwt()->'user_metadata'->>'phone')
);

-- Customers cannot delete their profiles through the client. Account deletion
-- is an owner-controlled backend operation, not a public CRUD capability.
drop policy if exists "profile delete own" on public.profiles;
revoke delete on public.profiles from anon, authenticated;

-- Explicitly deny direct client-side order creation/deletion. Orders are created
-- only through the validated place_order SECURITY DEFINER function; customers
-- can read only their own orders and admins can update via the admin policy.
drop policy if exists "customer order insert" on public.orders;
drop policy if exists "customer order delete" on public.orders;
revoke insert, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;

-- Admin-only product/order writes remain governed by the existing RLS policies.
