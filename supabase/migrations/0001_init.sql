-- SITES.BD Database Schema
-- PR-02: Supabase schema, migrations, RLS policies, and TS types

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- HELPERS: Functions and triggers
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique customer ID (SB-XXXXX format)
CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    attempts INT := 0;
BEGIN
    LOOP
        new_id := 'SB-' || upper(substring(gen_random_uuid()::text from 1 for 5));
        attempts := attempts + 1;
        EXIT WHEN attempts > 10 OR NOT EXISTS (SELECT 1 FROM profiles WHERE customer_id = new_id);
    END LOOP;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent email/mobile update after profile_verified
CREATE OR REPLACE FUNCTION prevent_immutable_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check if status is already profile_verified and email/mobile changed
    IF OLD.status = 'profile_verified'::profile_status 
       AND (
           OLD.email IS DISTINCT FROM NEW.email OR
           OLD.mobile IS DISTINCT FROM NEW.mobile
       ) THEN
        -- Allow if called by service role (check via has_role or similar)
        -- For now, we raise an exception
        RAISE EXCEPTION 'Email and mobile cannot be updated after profile verification. Contact support.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-fill customer_id on profile insert
CREATE OR REPLACE FUNCTION auto_fill_customer_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NULL THEN
        NEW.customer_id := generate_customer_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to compose full_domain for domains table
CREATE OR REPLACE FUNCTION compose_full_domain()
RETURNS TRIGGER AS $$
DECLARE
    tld_name_val TEXT;
BEGIN
    SELECT name INTO tld_name_val FROM tlds WHERE id = NEW.tld_id;
    IF tld_name_val IS NOT NULL THEN
        NEW.full_domain := NEW.name || '.' || tld_name_val;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce dns_records.tld_id matches domains.tld_id
CREATE OR REPLACE FUNCTION enforce_dns_tld_match()
RETURNS TRIGGER AS $$
DECLARE
    domain_tld_id UUID;
BEGIN
    SELECT tld_id INTO domain_tld_id FROM domains WHERE id = NEW.domain_id;
    IF domain_tld_id IS NOT NULL AND domain_tld_id != NEW.tld_id THEN
        RAISE EXCEPTION 'dns_records.tld_id must match the parent domain.tld_id';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE profile_status AS ENUM ('pending_otp', 'pre_verified', 'profile_verified', 'suspended');
CREATE TYPE otp_purpose AS ENUM ('registration', 'forgot_password');
CREATE TYPE domain_operational_status AS ENUM ('pending', 'active', 'suspend', 'issue', 'expired');
CREATE TYPE domain_verification_status AS ENUM ('waiting', 'verified');
CREATE TYPE dns_mode AS ENUM ('name_server', 'manual_dns');
CREATE TYPE dns_record_type AS ENUM ('A', 'CNAME', 'MX', 'TXT');
CREATE TYPE dns_record_source AS ENUM ('user_manual', 'auto_txt', 'admin', 'system');
CREATE TYPE txt_review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE hosting_type AS ENUM ('premium', 'free', 'custom_ns', 'custom_ip');
CREATE TYPE order_status AS ENUM ('pending_payment', 'active', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('pending_payment', 'paid', 'cancelled');
CREATE TYPE service_type AS ENUM ('hosting_premium', 'hosting_free', 'hosting_custom', 'addon');
CREATE TYPE service_renewal_status AS ENUM ('pending', 'processing', 'active', 'expired', 'suspended');
CREATE TYPE service_onetime_status AS ENUM ('waiting', 'processing', 'complete', 'cancel');
CREATE TYPE ticket_category AS ENUM ('technical', 'payment', 'general');
CREATE TYPE ticket_status AS ENUM ('open', 'awaiting_user', 'awaiting_admin', 'resolved', 'closed');
CREATE TYPE sender_type AS ENUM ('user', 'admin');
CREATE TYPE actor_type AS ENUM ('user', 'admin', 'system');

-- ============================================
-- TABLES
-- ============================================

-- 2.1 profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT UNIQUE NOT NULL,
    address TEXT,
    status profile_status DEFAULT 'pending_otp'::profile_status,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add trigger for auto-fill customer_id
CREATE TRIGGER trigger_auto_fill_customer_id
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_fill_customer_id();

-- Add trigger for prevent_immutable_profile_update
CREATE TRIGGER trigger_prevent_immutable_profile_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_immutable_profile_update();

-- Add trigger for updated_at
CREATE TRIGGER trigger_set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.2 otp_codes
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    purpose otp_purpose NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_otp_codes_email_purpose ON otp_codes(email, purpose);

CREATE TRIGGER trigger_set_updated_at_otp_codes
    BEFORE UPDATE ON otp_codes
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.3 tlds (parent-domain registry)
CREATE TABLE tlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    env_prefix TEXT NOT NULL,
    cloudflare_zone_id TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER trigger_set_updated_at_tlds
    BEFORE UPDATE ON tlds
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.4 domains
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tld_id UUID NOT NULL REFERENCES tlds(id),
    name TEXT NOT NULL,
    full_domain TEXT NOT NULL,
    operational_status domain_operational_status DEFAULT 'pending'::domain_operational_status,
    verification_status domain_verification_status DEFAULT 'waiting'::domain_verification_status,
    dns_mode dns_mode DEFAULT 'name_server'::dns_mode,
    custom_ns TEXT[],
    cloudflare_record_id TEXT,
    registered_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 year') NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- Unique constraints
    UNIQUE (tld_id, name),
    UNIQUE (full_domain)
);

CREATE INDEX idx_domains_tld_id ON domains(tld_id);
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_domains_expires_at ON domains(expires_at);
CREATE INDEX idx_domains_operational_status ON domains(operational_status);

CREATE TRIGGER trigger_compose_full_domain
    BEFORE INSERT OR UPDATE ON domains
    FOR EACH ROW
    EXECUTE FUNCTION compose_full_domain();

CREATE TRIGGER trigger_set_updated_at_domains
    BEFORE UPDATE ON domains
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.5 dns_records
CREATE TABLE dns_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    tld_id UUID NOT NULL REFERENCES tlds(id),
    type dns_record_type NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    ttl INT DEFAULT 3600,
    priority INT,
    cloudflare_record_id TEXT,
    source dns_record_source DEFAULT 'user_manual'::dns_record_source,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_dns_records_domain_id ON dns_records(domain_id);
CREATE INDEX idx_dns_records_tld_id ON dns_records(tld_id);

CREATE TRIGGER trigger_enforce_dns_tld_match
    BEFORE INSERT OR UPDATE ON dns_records
    FOR EACH ROW
    EXECUTE FUNCTION enforce_dns_tld_match();

CREATE TRIGGER trigger_set_updated_at_dns_records
    BEFORE UPDATE ON dns_records
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.6 txt_review_queue
CREATE TABLE txt_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    reason TEXT,
    status txt_review_status DEFAULT 'pending'::txt_review_status,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_txt_review_queue_domain_id ON txt_review_queue(domain_id);
CREATE INDEX idx_txt_review_queue_user_id ON txt_review_queue(user_id);
CREATE INDEX idx_txt_review_queue_status ON txt_review_queue(status);

CREATE TRIGGER trigger_set_updated_at_txt_review_queue
    BEFORE UPDATE ON txt_review_queue
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.7 cart_items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_token TEXT,
    tld_id UUID NOT NULL REFERENCES tlds(id),
    domain_name TEXT NOT NULL,
    full_domain TEXT NOT NULL,
    hosting_plan_id TEXT,
    hosting_type hosting_type,
    custom_ns_values TEXT[],
    custom_ip_value TEXT,
    addons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- Check: either user_id or session_token, not both
    CONSTRAINT chk_cart_user_or_session CHECK (
        (user_id IS NOT NULL AND session_token IS NULL) OR
        (user_id IS NULL AND session_token IS NOT NULL)
    ),
    CONSTRAINT chk_cart_unique_guest UNIQUE (session_token, tld_id, domain_name),
    CONSTRAINT chk_cart_unique_user UNIQUE (user_id, tld_id, domain_name)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_session_token ON cart_items(session_token);
CREATE INDEX idx_cart_items_tld_id ON cart_items(tld_id);

CREATE TRIGGER trigger_set_updated_at_cart_items
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.8 orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    order_number TEXT UNIQUE NOT NULL,
    status order_status DEFAULT 'pending_payment'::order_status,
    total_bdt NUMERIC(10,2) DEFAULT 0,
    items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TRIGGER trigger_set_updated_at_orders
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.9 invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    invoice_number TEXT UNIQUE NOT NULL,
    amount_bdt NUMERIC(10,2) NOT NULL,
    status invoice_status DEFAULT 'pending_payment'::invoice_status,
    paid_at TIMESTAMPTZ,
    paid_by_admin UUID REFERENCES profiles(id),
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE TRIGGER trigger_set_updated_at_invoices
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.10 services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
    type service_type NOT NULL,
    plan_id TEXT,
    status_renewal service_renewal_status,
    status_onetime service_onetime_status,
    access_url TEXT,
    access_username_encrypted TEXT,
    access_password_encrypted TEXT,
    internal_notes TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_domain_id ON services(domain_id);
CREATE INDEX idx_services_type ON services(type);

CREATE TRIGGER trigger_set_updated_at_services
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.11 tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    ticket_number TEXT UNIQUE NOT NULL,
    category ticket_category NOT NULL,
    whatsapp_number TEXT NOT NULL,
    subject TEXT NOT NULL,
    status ticket_status DEFAULT 'open'::ticket_status,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);

CREATE TRIGGER trigger_set_updated_at_tickets
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.12 ticket_messages
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender sender_type NOT NULL,
    sender_id UUID,
    body TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

CREATE TRIGGER trigger_set_updated_at_ticket_messages
    BEFORE UPDATE ON ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.13 banners
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    link_url TEXT,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_banners_active ON banners(active) WHERE active = true;
CREATE INDEX idx_banners_display_order ON banners(display_order);

CREATE TRIGGER trigger_set_updated_at_banners
    BEFORE UPDATE ON banners
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2.14 audit_log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    actor_type actor_type NOT NULL,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_log_target ON audit_log(target_table, target_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE txt_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: profiles
-- ============================================

-- User can read own profile
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- User can update own profile (but trigger prevents email/mobile change after verification)
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "profiles_select_admin" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- Admin can update all profiles
CREATE POLICY "profiles_update_admin" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: otp_codes
-- ============================================

-- No direct user access - only service role key can mutate
-- Users only interact via auth flows

-- ============================================
-- RLS POLICIES: tlds
-- ============================================

-- Everyone can read enabled TLDs
CREATE POLICY "tlds_select_enabled" ON tlds
    FOR SELECT USING (enabled = true);

-- Admin can manage TLDs
CREATE POLICY "tlds_all_admin" ON tlds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: domains
-- ============================================

-- User can read own domains
CREATE POLICY "domains_select_own" ON domains
    FOR SELECT USING (auth.uid() = user_id);

-- User can insert own domains
CREATE POLICY "domains_insert_own" ON domains
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User can update own domains
CREATE POLICY "domains_update_own" ON domains
    FOR UPDATE USING (auth.uid() = user_id);

-- User can delete own domains
CREATE POLICY "domains_delete_own" ON domains
    FOR DELETE USING (auth.uid() = user_id);

-- Admin can read all domains
CREATE POLICY "domains_select_admin" ON domains
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- Admin can update all domains
CREATE POLICY "domains_update_admin" ON domains
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: dns_records
-- ============================================

-- User can read DNS records for own domains
CREATE POLICY "dns_records_select_own" ON dns_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM domains d 
            WHERE d.id = domain_id AND d.user_id = auth.uid()
        )
    );

-- User can insert DNS records for own domains
CREATE POLICY "dns_records_insert_own" ON dns_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM domains d 
            WHERE d.id = domain_id AND d.user_id = auth.uid()
        )
    );

-- User can update DNS records for own domains
CREATE POLICY "dns_records_update_own" ON dns_records
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM domains d 
            WHERE d.id = domain_id AND d.user_id = auth.uid()
        )
    );

-- User can delete DNS records for own domains
CREATE POLICY "dns_records_delete_own" ON dns_records
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM domains d 
            WHERE d.id = domain_id AND d.user_id = auth.uid()
        )
    );

-- Admin can manage all DNS records
CREATE POLICY "dns_records_all_admin" ON dns_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: txt_review_queue
-- ============================================

-- User can read own pending items
CREATE POLICY "txt_review_select_own" ON txt_review_queue
    FOR SELECT USING (auth.uid() = user_id);

-- Admin can manage all txt_review items
CREATE POLICY "txt_review_all_admin" ON txt_review_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: cart_items
-- ============================================

-- User can read own cart items
CREATE POLICY "cart_items_select_own" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);

-- User can manage own cart items
CREATE POLICY "cart_items_all_own" ON cart_items
    FOR ALL USING (auth.uid() = user_id);

-- Admin can manage all cart items
CREATE POLICY "cart_items_all_admin" ON cart_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: orders
-- ============================================

-- User can read own orders
CREATE POLICY "orders_select_own" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- User can insert own orders
CREATE POLICY "orders_insert_own" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can manage all orders
CREATE POLICY "orders_all_admin" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: invoices
-- ============================================

-- User can read own invoices
CREATE POLICY "invoices_select_own" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

-- Admin can manage all invoices
CREATE POLICY "invoices_all_admin" ON invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: services
-- ============================================

-- User can read own services
CREATE POLICY "services_select_own" ON services
    FOR SELECT USING (auth.uid() = user_id);

-- User can update own services
CREATE POLICY "services_update_own" ON services
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin can manage all services
CREATE POLICY "services_all_admin" ON services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: tickets
-- ============================================

-- User can read own tickets
CREATE POLICY "tickets_select_own" ON tickets
    FOR SELECT USING (auth.uid() = user_id);

-- User can insert own tickets
CREATE POLICY "tickets_insert_own" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User can update own tickets
CREATE POLICY "tickets_update_own" ON tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin can manage all tickets
CREATE POLICY "tickets_all_admin" ON tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: ticket_messages
-- ============================================

-- User can read messages for own tickets
CREATE POLICY "ticket_messages_select_own" ON ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tickets t 
            WHERE t.id = ticket_id AND t.user_id = auth.uid()
        )
    );

-- User can insert messages for own tickets
CREATE POLICY "ticket_messages_insert_own" ON ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets t 
            WHERE t.id = ticket_id AND t.user_id = auth.uid()
        )
    );

-- Admin can manage all ticket messages
CREATE POLICY "ticket_messages_all_admin" ON ticket_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: banners
-- ============================================

-- Authenticated users can read active banners
CREATE POLICY "banners_select_auth" ON banners
    FOR SELECT USING (active = true AND auth.uid() IS NOT NULL);

-- Admin can manage banners
CREATE POLICY "banners_all_admin" ON banners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- RLS POLICIES: audit_log
-- ============================================

-- Only admins can read audit log
CREATE POLICY "audit_log_select_admin" ON audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE profiles IS 'User profiles - mirrors auth.users with additional fields';
COMMENT ON TABLE otp_codes IS 'OTP codes for registration and password reset';
COMMENT ON TABLE tlds IS 'Parent domain registry - multi-TLD root';
COMMENT ON TABLE domains IS 'Claimed subdomains - unique per (tld_id, name)';
COMMENT ON TABLE dns_records IS 'DNS records for domains';
COMMENT ON TABLE txt_review_queue IS 'Escalated TXT records awaiting admin review';
COMMENT ON TABLE cart_items IS 'Shopping cart items';
COMMENT ON TABLE orders IS 'Orders placed by users';
COMMENT ON TABLE invoices IS 'Invoices generated from orders';
COMMENT ON TABLE services IS 'Hosting services and addons';
COMMENT ON TABLE tickets IS 'Support tickets';
COMMENT ON TABLE ticket_messages IS 'Messages in support tickets';
COMMENT ON TABLE banners IS 'Admin-controlled dashboard banners';
COMMENT ON TABLE audit_log IS 'System audit log for compliance';