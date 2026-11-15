-- Fix profile RLS for provisional registrations.
-- A customer may only create/update the row whose id is their own auth.uid().
-- Phone is collected but intentionally unverified at this stage.
drop policy if exists "profile insert own" on public.profiles;
create policy "profile insert own" on public.profiles
for insert to authenticated
with check (id = (select auth.uid()));

drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
