-- Texas Ranch Meat: customer accounts, catalog, order management.
-- Apply in Supabase SQL Editor. No service-role key belongs in the browser.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  full_name text not null default '',
  address text not null default '',
  zip text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do update set phone = excluded.phone;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_trm on auth.users;
create trigger on_auth_user_created_trm after insert or update of phone on auth.users
for each row execute procedure public.handle_new_auth_user();

create table if not exists public.products (
  id text primary key,
  category text not null check (category in ('goat','chicken')),
  name text not null,
  weight_lb numeric(8,2) not null check (weight_lb > 0),
  price_per_lb numeric(10,2) not null check (price_per_lb >= 0),
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.products (id,category,name,weight_lb,price_per_lb,stock) values
('goat-curry','goat','Bone-In Goat Curry Cut',2,11.49,20),
('goat-shoulder','goat','Texas Pasture Goat Shoulder',3,12.29,14),
('goat-leg','goat','Whole Ranch Goat Leg',4,13.49,10),
('goat-biryani','goat','Ranch Biryani Cut (Bone-In)',2,11.99,16),
('chicken-country','chicken','Pasture Country Chicken (Whole)',3.5,6.49,0)
on conflict (id) do nothing;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  status text not null default 'Received' check (status in ('Received','Packaged','On the Way!','Delivered','Cancelled')),
  payment_method text not null default 'Cash on Sunday',
  payment_status text not null default 'Pending' check (payment_status in ('Pending','Paid','Unpaid','Refunded')),
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 2.99,
  total numeric(10,2) not null,
  delivery_address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  weight_lb numeric(8,2) not null,
  price_per_lb numeric(10,2) not null,
  line_total numeric(10,2) not null
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_trm_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()));
$$;

create or replace function public.place_order(p_items jsonb, p_payment_method text default 'Cash on Sunday')
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_subtotal numeric(10,2) := 0;
  v_fee numeric(10,2) := 2.99;
  v_order_id uuid;
begin
  if v_uid is null then raise exception 'Please sign in before placing an order.'; end if;
  select * into v_profile from public.profiles where id = v_uid for update;
  if not found or v_profile.full_name = '' or v_profile.address = '' or v_profile.zip = '' then
    raise exception 'Complete your delivery profile before ordering.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your basket is empty.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty < 1 or v_qty > 30 then raise exception 'Invalid item quantity.'; end if;
    select * into v_product from public.products
      where id = v_item->>'product_id' and active = true for update;
    if not found then raise exception 'A selected product is unavailable.'; end if;
    if v_product.stock < v_qty then raise exception 'Insufficient stock for %.', v_product.name; end if;
    v_subtotal := v_subtotal + (v_product.weight_lb * v_product.price_per_lb * v_qty);
  end loop;

  insert into public.orders(customer_id,payment_method,subtotal,delivery_fee,total,delivery_address)
  values (v_uid, coalesce(nullif(p_payment_method,''),'Cash on Sunday'), v_subtotal, v_fee, v_subtotal+v_fee,
          v_profile.address || ', ' || v_profile.zip)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = v_item->>'product_id' for update;
    update public.products set stock = stock - v_qty, updated_at = now() where id = v_product.id;
    insert into public.order_items(order_id,product_id,product_name,quantity,weight_lb,price_per_lb,line_total)
    values (v_order_id,v_product.id,v_product.name,v_qty,v_product.weight_lb,v_product.price_per_lb,
            v_product.weight_lb*v_product.price_per_lb*v_qty);
  end loop;
  return v_order_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "profile read own or admin" on public.profiles;
create policy "profile read own or admin" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_trm_admin());
drop policy if exists "profile insert own" on public.profiles;
create policy "profile insert own" on public.profiles for insert to authenticated
with check (id = (select auth.uid()) and phone = (select auth.jwt()->>'phone'));
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()) and phone = (select auth.jwt()->>'phone'));

drop policy if exists "catalog visible" on public.products;
create policy "catalog visible" on public.products for select to anon, authenticated using (active = true or public.is_trm_admin());
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products for all to authenticated
using (public.is_trm_admin()) with check (public.is_trm_admin());

drop policy if exists "customer orders read own or admin" on public.orders;
create policy "customer orders read own or admin" on public.orders for select to authenticated
using (customer_id = (select auth.uid()) or public.is_trm_admin());
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders for update to authenticated
using (public.is_trm_admin()) with check (public.is_trm_admin());

drop policy if exists "customer order items read own or admin" on public.order_items;
create policy "customer order items read own or admin" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and
  (o.customer_id = (select auth.uid()) or public.is_trm_admin())));

drop policy if exists "admin list visible to admins" on public.admin_users;
create policy "admin list visible to admins" on public.admin_users for select to authenticated
using (user_id = (select auth.uid()) or public.is_trm_admin());

revoke all on function public.place_order(jsonb,text) from public;
grant execute on function public.place_order(jsonb,text) to authenticated;
grant select on public.products to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.admin_users to authenticated;
