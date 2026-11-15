-- Provisional registration before WhatsApp Business verification is configured.
-- Anonymous Auth users receive an authenticated session scoped to this browser.
-- The submitted phone is explicitly UNVERIFIED and must not be used for messaging.
drop policy if exists "profile insert own" on public.profiles;
create policy "profile insert own" on public.profiles for insert to authenticated
with check (
  id = (select auth.uid())
  and phone = (select auth.jwt()->'user_metadata'->>'phone')
);
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and phone = (select auth.jwt()->'user_metadata'->>'phone')
);
