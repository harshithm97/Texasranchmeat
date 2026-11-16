-- Store matched US address and customer-confirmed coordinates privately on each profile.
alter table public.profiles
 add column if not exists address_lat double precision,
 add column if not exists address_lon double precision,
 add column if not exists address_match text,
 add column if not exists address_verified_at timestamptz;
do $$ begin
 if not exists (select 1 from pg_constraint where conname='profiles_address_coordinates_pair') then
  alter table public.profiles add constraint profiles_address_coordinates_pair
  check ((address_lat is null and address_lon is null) or
   (address_lat between -90 and 90 and address_lon between -180 and 180));
 end if;
end $$;
comment on column public.profiles.address_match is 'OpenStreetMap Photon matched address; private customer profile data.';
comment on column public.profiles.address_verified_at is 'Time customer confirmed the map pin; not proof of delivery-area eligibility.';
