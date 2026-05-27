create extension if not exists "pgcrypto";

create or replace function is_admin_user(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (select 1 from profiles p where p.id = uid and p.is_admin = true);
$$;

create or replace function is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type profile_status as enum ('pending_otp','pre_verified','profile_verified','suspended');
create type otp_purpose as enum ('registration','forgot_password');
create type domain_operational_status as enum ('pending','active','suspend','issue','expired');
create type domain_verification_status as enum ('waiting','verified');
create type dns_mode as enum ('name_server','manual_dns');
create type dns_record_type as enum ('A','CNAME','MX','TXT');
create type dns_record_source as enum ('user_manual','auto_txt','admin','system');
create type txt_review_status as enum ('pending','approved','rejected');
create type hosting_type as enum ('premium','free','custom_ns','custom_ip');
create type order_status as enum ('pending_payment','active','cancelled');
create type invoice_status as enum ('pending_payment','paid','cancelled');
create type service_type as enum ('hosting_premium','hosting_free','hosting_custom','addon');
create type service_renewal_status as enum ('pending','processing','active','expired','suspended');
create type service_onetime_status as enum ('waiting','processing','complete','cancel');
create type ticket_category as enum ('technical','payment','general');
create type ticket_status as enum ('open','awaiting_user','awaiting_admin','resolved','closed');
create type sender_type as enum ('user','admin');
create type actor_type as enum ('user','admin','system');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  customer_id text unique not null,
  full_name text,
  email text unique not null,
  mobile text unique not null,
  address text,
  status profile_status not null default 'pending_otp',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function generate_customer_id()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'SB-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 5));
    exit when not exists (select 1 from profiles where customer_id = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function auto_fill_customer_id()
returns trigger
language plpgsql
as $$
begin
  if new.customer_id is null then
    new.customer_id := generate_customer_id();
  end if;
  return new;
end;
$$;

create or replace function prevent_profile_verified_identity_change()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'profile_verified'
    and (old.email is distinct from new.email or old.mobile is distinct from new.mobile)
    and not is_service_role() then
    raise exception 'email/mobile immutable after profile_verified';
  end if;
  return new;
end;
$$;

create table otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  purpose otp_purpose not null,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_otp_codes_email_purpose on otp_codes(email, purpose);

create table tlds (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text unique not null,
  env_prefix text not null,
  cloudflare_zone_id text not null,
  enabled boolean not null default true,
  is_primary boolean not null default false,
  display_order int not null default 0,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index idx_tlds_single_primary on tlds (is_primary) where is_primary;

create table domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tld_id uuid not null references tlds(id),
  name text not null,
  full_domain text not null,
  operational_status domain_operational_status not null default 'pending',
  verification_status domain_verification_status not null default 'waiting',
  dns_mode dns_mode not null default 'name_server',
  custom_ns text[],
  cloudflare_record_id text,
  registered_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tld_id, name),
  unique (full_domain)
);
create index idx_domains_tld_id on domains(tld_id);
create index idx_domains_user_id on domains(user_id);
create index idx_domains_expires_at on domains(expires_at);
create index idx_domains_operational_status on domains(operational_status);

create or replace function compose_full_domain()
returns trigger
language plpgsql
as $$
declare
  tld_name text;
begin
  select name into tld_name from tlds where id = new.tld_id;
  if tld_name is null then
    raise exception 'tld not found for id %', new.tld_id;
  end if;
  new.full_domain := new.name || '.' || tld_name;
  return new;
end;
$$;

create table dns_records (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id) on delete cascade,
  tld_id uuid not null references tlds(id),
  type dns_record_type not null,
  name text not null,
  content text not null,
  ttl int not null default 3600,
  priority int,
  cloudflare_record_id text,
  source dns_record_source not null default 'user_manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function enforce_dns_tld_match()
returns trigger
language plpgsql
as $$
declare
  expected_tld uuid;
begin
  select tld_id into expected_tld from domains where id = new.domain_id;
  if expected_tld is null then
    raise exception 'domain not found for id %', new.domain_id;
  end if;
  if new.tld_id <> expected_tld then
    raise exception 'dns_records.tld_id must equal domains.tld_id';
  end if;
  return new;
end;
$$;

create table txt_review_queue (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id) on delete cascade,
  user_id uuid not null references profiles(id),
  name text not null,
  content text not null,
  reason text,
  status txt_review_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  session_token text,
  tld_id uuid not null references tlds(id),
  domain_name text not null,
  full_domain text not null,
  hosting_plan_id text,
  hosting_type hosting_type,
  custom_ns_values text[],
  custom_ip_value text,
  addons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_cart_user_or_session check ((user_id is null) <> (session_token is null))
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  order_number text unique not null,
  status order_status not null default 'pending_payment',
  total_bdt numeric(10,2) not null default 0,
  items jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  user_id uuid not null references profiles(id),
  invoice_number text unique not null,
  amount_bdt numeric(10,2) not null,
  status invoice_status not null default 'pending_payment',
  paid_at timestamptz,
  paid_by_admin uuid references profiles(id),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  domain_id uuid references domains(id) on delete set null,
  type service_type not null,
  plan_id text,
  status_renewal service_renewal_status,
  status_onetime service_onetime_status,
  access_url text,
  access_username_encrypted text,
  access_password_encrypted text,
  internal_notes text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  ticket_number text unique not null,
  category ticket_category not null,
  whatsapp_number text not null,
  subject text not null,
  status ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  sender sender_type not null,
  sender_id uuid,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text,
  display_order int not null default 0,
  active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_type actor_type not null,
  action text not null,
  target_table text,
  target_id uuid,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_customer before insert on profiles for each row execute function auto_fill_customer_id();
create trigger trg_profiles_immutable before update on profiles for each row execute function prevent_profile_verified_identity_change();
create trigger trg_domains_full before insert or update on domains for each row execute function compose_full_domain();
create trigger trg_dns_tld before insert or update on dns_records for each row execute function enforce_dns_tld_match();

create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger trg_otp_updated before update on otp_codes for each row execute function set_updated_at();
create trigger trg_tlds_updated before update on tlds for each row execute function set_updated_at();
create trigger trg_domains_updated before update on domains for each row execute function set_updated_at();
create trigger trg_dns_updated before update on dns_records for each row execute function set_updated_at();
create trigger trg_txt_updated before update on txt_review_queue for each row execute function set_updated_at();
create trigger trg_cart_updated before update on cart_items for each row execute function set_updated_at();
create trigger trg_orders_updated before update on orders for each row execute function set_updated_at();
create trigger trg_invoices_updated before update on invoices for each row execute function set_updated_at();
create trigger trg_services_updated before update on services for each row execute function set_updated_at();
create trigger trg_tickets_updated before update on tickets for each row execute function set_updated_at();
create trigger trg_ticket_messages_updated before update on ticket_messages for each row execute function set_updated_at();
create trigger trg_banners_updated before update on banners for each row execute function set_updated_at();
create trigger trg_audit_updated before update on audit_log for each row execute function set_updated_at();

alter table profiles enable row level security;
alter table otp_codes enable row level security;
alter table tlds enable row level security;
alter table domains enable row level security;
alter table dns_records enable row level security;
alter table txt_review_queue enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table invoices enable row level security;
alter table services enable row level security;
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table banners enable row level security;
alter table audit_log enable row level security;

create policy profiles_select_own on profiles for select using (auth.uid() = id);
create policy profiles_update_own on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_select_admin on profiles for select using (is_admin_user(auth.uid()));
create policy profiles_update_admin on profiles for update using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy otp_codes_service_only_select on otp_codes for select using (is_service_role());
create policy otp_codes_service_only_insert on otp_codes for insert with check (is_service_role());
create policy otp_codes_service_only_update on otp_codes for update using (is_service_role()) with check (is_service_role());
create policy otp_codes_service_only_delete on otp_codes for delete using (is_service_role());

create policy tlds_select_authenticated on tlds for select using (auth.uid() is not null);
create policy tlds_admin_insert on tlds for insert with check (is_admin_user(auth.uid()));
create policy tlds_admin_update on tlds for update using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy domains_user_select on domains for select using (auth.uid() = user_id);
create policy domains_user_insert on domains for insert with check (auth.uid() = user_id);
create policy domains_user_update on domains for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy domains_admin_all_select on domains for select using (is_admin_user(auth.uid()));
create policy domains_admin_all_write on domains for all using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy dns_user_select on dns_records for select using (exists (select 1 from domains d where d.id = domain_id and d.user_id = auth.uid()));
create policy dns_user_write on dns_records for all using (exists (select 1 from domains d where d.id = domain_id and d.user_id = auth.uid())) with check (exists (select 1 from domains d where d.id = domain_id and d.user_id = auth.uid()));
create policy dns_admin_all on dns_records for all using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy txt_user_select_pending on txt_review_queue for select using (auth.uid() = user_id and status = 'pending');
create policy txt_admin_all on txt_review_queue for all using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy cart_user_select on cart_items for select using (auth.uid() = user_id);
create policy cart_user_write on cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cart_admin_all on cart_items for all using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy orders_user_select on orders for select using (auth.uid() = user_id);
create policy orders_user_write on orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy orders_admin_all on orders for all using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy invoices_user_select on invoices for select using (auth.uid() = user_id);
create policy invoices_admin_all on invoices for all using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy services_user_select on services for select using (auth.uid() = user_id);
create policy services_admin_all on services for all using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy tickets_user_select on tickets for select using (auth.uid() = user_id);
create policy tickets_user_write on tickets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tickets_admin_all on tickets for all using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy ticket_messages_user_select on ticket_messages for select using (exists (select 1 from tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy ticket_messages_user_write on ticket_messages for all using (exists (select 1 from tickets t where t.id = ticket_id and t.user_id = auth.uid())) with check (exists (select 1 from tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy ticket_messages_admin_all on ticket_messages for all using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy banners_auth_select_active on banners for select using (auth.uid() is not null and active = true);
create policy banners_admin_all on banners for all using (is_admin_user(auth.uid())) with check (is_admin_user(auth.uid()));

create policy audit_admin_select on audit_log for select using (is_admin_user(auth.uid()));
create policy audit_service_write on audit_log for all using (is_service_role()) with check (is_service_role());
