// Browser-safe Supabase client. Publishable keys are intended for frontend use.
// Authorization is enforced by PostgreSQL RLS and SECURITY DEFINER RPCs.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://fptpypybmsyejhbqibku.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qLgrNV2zkybMwXgaTvMzHw_F4WzaKO3";
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

export async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") throw error;
  return data?.user || null;
}
export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("id,phone,full_name,address,zip,address_lat,address_lon,address_match,address_verified_at").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}
export async function saveProfile(profile) {
  const { data, error } = await supabase.from("profiles").upsert({
    id: profile.id, phone: profile.phone, full_name: profile.full_name,
    address: profile.address, zip: profile.zip, address_lat: profile.address_lat, address_lon: profile.address_lon, address_match: profile.address_match, address_verified_at: profile.address_verified_at, updated_at: new Date().toISOString()
  }).select("id,phone,full_name,address,zip,address_lat,address_lon,address_match,address_verified_at").single();
  if (error) throw error;
  return data;
}
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
