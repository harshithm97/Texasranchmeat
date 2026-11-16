-- Product catalogue administration. RLS policies from migration 001 restrict writes to public.is_trm_admin().
-- Grant table privileges to authenticated users; RLS remains the authorization boundary.
grant insert, update, delete on public.products to authenticated;
grant select on public.products to anon;
