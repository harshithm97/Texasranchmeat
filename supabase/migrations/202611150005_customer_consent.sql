-- Record acceptance of the Terms & Conditions and Privacy Policy.
create table if not exists public.customer_consents (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  phone text not null,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now()
);
alter table public.customer_consents enable row level security;
drop policy if exists "customer consent insert own" on public.customer_consents;
create policy "customer consent insert own" on public.customer_consents
for insert to authenticated
with check (user_id = (select auth.uid()) and phone = (select auth.jwt()->'user_metadata'->>'phone'));
drop policy if exists "customer consent read own" on public.customer_consents;
create policy "customer consent read own" on public.customer_consents
for select to authenticated
using (user_id = (select auth.uid()) or public.is_trm_admin());
revoke update, delete on public.customer_consents from anon, authenticated;
grant insert, select on public.customer_consents to authenticated;

-- Admin access is intentionally NOT granted from a phone-number match.
-- Phone-only identity is not verified yet. After secure WhatsApp verification,
-- add the verified admin auth.users UUID to public.admin_users from the SQL
-- editor. Contact number supplied by owner: +1-949-295-4650.
