insert into tlds (slug, name, env_prefix, cloudflare_zone_id, enabled, is_primary, display_order, label)
values
('sites-bd','sites.bd','CF_SITES_BD','pending-zone-id-sites-bd',true,true,1,'sites.bd'),
('esite-top','esite.top','CF_ESITE_TOP','pending-zone-id-esite-top',true,false,2,'esite.top'),
('esite-in','esite.in','CF_ESITE_IN','pending-zone-id-esite-in',true,false,3,'esite.in')
on conflict (slug) do update set
  name = excluded.name,
  env_prefix = excluded.env_prefix,
  enabled = excluded.enabled,
  is_primary = excluded.is_primary,
  display_order = excluded.display_order,
  label = excluded.label;

-- Admin auth user UUID (create this user in Supabase Auth dashboard first, then set password manually).
-- Hardcoded UUID for testability as requested.
-- insert into profiles (id, customer_id, full_name, email, mobile, status, is_admin)
-- values ('00000000-0000-0000-0000-000000000001','SB-ADMIN','System Admin','admin@sites.bd','+8801700000000','profile_verified',true)
-- on conflict (id) do update set
--   full_name = excluded.full_name,
--   email = excluded.email,
--   mobile = excluded.mobile,
--   status = excluded.status,
--   is_admin = excluded.is_admin;

insert into banners (image_url, link_url, display_order, active)
values
('https://placehold.co/1200x400/2563eb/ffffff?text=SITES.BD+Banner+1','/check',1,true),
('https://placehold.co/1200x400/1d4ed8/ffffff?text=SITES.BD+Banner+2','/register',2,true),
('https://placehold.co/1200x400/1e40af/ffffff?text=SITES.BD+Banner+3','/services',3,true);
