-- SITES.BD Seed Data
-- Run this after 0001_init.sql

-- ============================================
-- SEED TLDs (from src/config/domains.json)
-- ============================================

INSERT INTO tlds (slug, name, env_prefix, cloudflare_zone_id, enabled, is_primary, display_order, label)
VALUES 
    ('sites-bd', 'sites.bd', 'CF_SITES_BD', '', true, true, 1, 'sites.bd'),
    ('esite-top', 'esite.top', 'CF_ESITE_TOP', '', true, false, 2, 'esite.top'),
    ('esite-in', 'esite.in', 'CF_ESITE_IN', '', true, false, 3, 'esite.in');

-- ============================================
-- SEED ADMIN USER
-- NOTE: This user must be created in Supabase Auth first!
-- Use: supabase auth or dashboard to create the user,
-- then update the id below to match.
-- 
-- For testing, we're using a hardcoded UUID.
-- In production, create the user first, then update this seed.
-- ============================================

-- Example: Create admin user (uncomment and run after creating auth user)
-- INSERT INTO profiles (id, full_name, email, mobile, status, is_admin)
-- VALUES 
--     ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@sites.bd', '+8801700000000', 'profile_verified', true);

-- ============================================
-- SEED BANNERS (3 sample banners)
-- ============================================

INSERT INTO banners (image_url, link_url, display_order, active, created_by)
VALUES 
    ('https://placehold.co/1200x400/2563eb/ffffff?text=Welcome+to+SITES.BD', '/check', 1, true, NULL),
    ('https://placehold.co/1200x400/1d4ed8/ffffff?text=Free+Subdomains+Available', '/register', 2, true, NULL),
    ('https://placehold.co/1200x400/1e40af/ffffff?text=Get+Your+Domain+Today', '/services', 3, true, NULL);

-- ============================================
-- NOTES
-- ============================================

-- To set up admin user:
-- 1. Create user in Supabase Auth dashboard
-- 2. Copy the user's UUID
-- 3. Run: INSERT INTO profiles (id, full_name, email, mobile, status, is_admin) 
--    VALUES ('<your-uuid>', 'Admin Name', 'admin@example.com', '+8801XXXXXXXX', 'profile_verified', true);

-- Cloudflare Zone IDs should be filled in from env vars:
-- UPDATE tlds SET cloudflare_zone_id = 'your-zone-id' WHERE slug = 'sites-bd';
-- etc.