// SITES.BD Supabase Types
// Generated from schema - PR-02

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type profile_status = "pending_otp" | "pre_verified" | "profile_verified" | "suspended";
export type otp_purpose = "registration" | "forgot_password";
export type domain_operational_status = "pending" | "active" | "suspend" | "issue" | "expired";
export type domain_verification_status = "waiting" | "verified";
export type dns_mode = "name_server" | "manual_dns";
export type dns_record_type = "A" | "CNAME" | "MX" | "TXT";
export type dns_record_source = "user_manual" | "auto_txt" | "admin" | "system";
export type txt_review_status = "pending" | "approved" | "rejected";
export type hosting_type = "premium" | "free" | "custom_ns" | "custom_ip";
export type order_status = "pending_payment" | "active" | "cancelled";
export type invoice_status = "pending_payment" | "paid" | "cancelled";
export type service_type = "hosting_premium" | "hosting_free" | "hosting_custom" | "addon";
export type service_renewal_status = "pending" | "processing" | "active" | "expired" | "suspended";
export type service_onetime_status = "waiting" | "processing" | "complete" | "cancel";
export type ticket_category = "technical" | "payment" | "general";
export type ticket_status = "open" | "awaiting_user" | "awaiting_admin" | "resolved" | "closed";
export type sender_type = "user" | "admin";
export type actor_type = "user" | "admin" | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          customer_id: string;
          full_name: string | null;
          email: string;
          mobile: string;
          address: string | null;
          status: profile_status;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          customer_id?: string;
          full_name?: string | null;
          email: string;
          mobile: string;
          address?: string | null;
          status?: profile_status;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          full_name?: string | null;
          email?: string;
          mobile?: string;
          address?: string | null;
          status?: profile_status;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      otp_codes: {
        Row: {
          id: string;
          email: string;
          code_hash: string;
          purpose: otp_purpose;
          expires_at: string;
          consumed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          code_hash: string;
          purpose: otp_purpose;
          expires_at: string;
          consumed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          code_hash?: string;
          purpose?: otp_purpose;
          expires_at?: string;
          consumed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tlds: {
        Row: {
          id: string;
          slug: string;
          name: string;
          env_prefix: string;
          cloudflare_zone_id: string;
          enabled: boolean;
          is_primary: boolean;
          display_order: number;
          label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          env_prefix: string;
          cloudflare_zone_id: string;
          enabled?: boolean;
          is_primary?: boolean;
          display_order?: number;
          label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          env_prefix?: string;
          cloudflare_zone_id?: string;
          enabled?: boolean;
          is_primary?: boolean;
          display_order?: number;
          label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      domains: {
        Row: {
          id: string;
          user_id: string;
          tld_id: string;
          name: string;
          full_domain: string;
          operational_status: domain_operational_status;
          verification_status: domain_verification_status;
          dns_mode: dns_mode;
          custom_ns: string[] | null;
          cloudflare_record_id: string | null;
          registered_at: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tld_id: string;
          name: string;
          full_domain?: string;
          operational_status?: domain_operational_status;
          verification_status?: domain_verification_status;
          dns_mode?: dns_mode;
          custom_ns?: string[] | null;
          cloudflare_record_id?: string | null;
          registered_at?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tld_id?: string;
          name?: string;
          full_domain?: string;
          operational_status?: domain_operational_status;
          verification_status?: domain_verification_status;
          dns_mode?: dns_mode;
          custom_ns?: string[] | null;
          cloudflare_record_id?: string | null;
          registered_at?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      dns_records: {
        Row: {
          id: string;
          domain_id: string;
          tld_id: string;
          type: dns_record_type;
          name: string;
          content: string;
          ttl: number;
          priority: number | null;
          cloudflare_record_id: string | null;
          source: dns_record_source;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain_id: string;
          tld_id: string;
          type: dns_record_type;
          name: string;
          content: string;
          ttl?: number;
          priority?: number | null;
          cloudflare_record_id?: string | null;
          source?: dns_record_source;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain_id?: string;
          tld_id?: string;
          type?: dns_record_type;
          name?: string;
          content?: string;
          ttl?: number;
          priority?: number | null;
          cloudflare_record_id?: string | null;
          source?: dns_record_source;
          created_at?: string;
          updated_at?: string;
        };
      };
      txt_review_queue: {
        Row: {
          id: string;
          domain_id: string;
          user_id: string;
          name: string;
          content: string;
          reason: string | null;
          status: txt_review_status;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain_id: string;
          user_id: string;
          name: string;
          content: string;
          reason?: string | null;
          status?: txt_review_status;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain_id?: string;
          user_id?: string;
          name?: string;
          content?: string;
          reason?: string | null;
          status?: txt_review_status;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string | null;
          session_token: string | null;
          tld_id: string;
          domain_name: string;
          full_domain: string;
          hosting_plan_id: string | null;
          hosting_type: hosting_type | null;
          custom_ns_values: string[] | null;
          custom_ip_value: string | null;
          addons: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_token?: string | null;
          tld_id: string;
          domain_name: string;
          full_domain: string;
          hosting_plan_id?: string | null;
          hosting_type?: hosting_type | null;
          custom_ns_values?: string[] | null;
          custom_ip_value?: string | null;
          addons?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_token?: string | null;
          tld_id?: string;
          domain_name?: string;
          full_domain?: string;
          hosting_plan_id?: string | null;
          hosting_type?: hosting_type | null;
          custom_ns_values?: string[] | null;
          custom_ip_value?: string | null;
          addons?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: order_status;
          total_bdt: number;
          items: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          status?: order_status;
          total_bdt?: number;
          items: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?: order_status;
          total_bdt?: number;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          invoice_number: string;
          amount_bdt: number;
          status: invoice_status;
          paid_at: string | null;
          paid_by_admin: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          invoice_number: string;
          amount_bdt: number;
          status?: invoice_status;
          paid_at?: string | null;
          paid_by_admin?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          user_id?: string;
          invoice_number?: string;
          amount_bdt?: number;
          status?: invoice_status;
          paid_at?: string | null;
          paid_by_admin?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          user_id: string;
          domain_id: string | null;
          type: service_type;
          plan_id: string | null;
          status_renewal: service_renewal_status | null;
          status_onetime: service_onetime_status | null;
          access_url: string | null;
          access_username_encrypted: string | null;
          access_password_encrypted: string | null;
          internal_notes: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain_id?: string | null;
          type: service_type;
          plan_id?: string | null;
          status_renewal?: service_renewal_status | null;
          status_onetime?: service_onetime_status | null;
          access_url?: string | null;
          access_username_encrypted?: string | null;
          access_password_encrypted?: string | null;
          internal_notes?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain_id?: string | null;
          type?: service_type;
          plan_id?: string | null;
          status_renewal?: service_renewal_status | null;
          status_onetime?: service_onetime_status | null;
          access_url?: string | null;
          access_username_encrypted?: string | null;
          access_password_encrypted?: string | null;
          internal_notes?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          user_id: string;
          ticket_number: string;
          category: ticket_category;
          whatsapp_number: string;
          subject: string;
          status: ticket_status;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ticket_number: string;
          category: ticket_category;
          whatsapp_number: string;
          subject: string;
          status?: ticket_status;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ticket_number?: string;
          category?: ticket_category;
          whatsapp_number?: string;
          subject?: string;
          status?: ticket_status;
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender: sender_type;
          sender_id: string | null;
          body: string;
          attachments: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          sender: sender_type;
          sender_id?: string | null;
          body: string;
          attachments?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          sender?: sender_type;
          sender_id?: string | null;
          body?: string;
          attachments?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      banners: {
        Row: {
          id: string;
          image_url: string;
          link_url: string | null;
          display_order: number;
          active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          link_url?: string | null;
          display_order?: number;
          active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          link_url?: string | null;
          display_order?: number;
          active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_type: actor_type;
          action: string;
          target_table: string | null;
          target_id: string | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_type: actor_type;
          action: string;
          target_table?: string | null;
          target_id?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          actor_type?: actor_type;
          action?: string;
          target_table?: string | null;
          target_id?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_customer_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      profile_status: profile_status;
      otp_purpose: otp_purpose;
      domain_operational_status: domain_operational_status;
      domain_verification_status: domain_verification_status;
      dns_mode: dns_mode;
      dns_record_type: dns_record_type;
      dns_record_source: dns_record_source;
      txt_review_status: txt_review_status;
      hosting_type: hosting_type;
      order_status: order_status;
      invoice_status: invoice_status;
      service_type: service_type;
      service_renewal_status: service_renewal_status;
      service_onetime_status: service_onetime_status;
      ticket_category: ticket_category;
      ticket_status: ticket_status;
      sender_type: sender_type;
      actor_type: actor_type;
    };
  };
}

// Convenience types
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

// Table-specific types
export type Profile = Tables<"profiles">;
export type Tld = Tables<"tlds">;
export type Domain = Tables<"domains">;
export type DnsRecord = Tables<"dns_records">;
export type OtpCode = Tables<"otp_codes">;
export type CartItem = Tables<"cart_items">;
export type Order = Tables<"orders">;
export type Invoice = Tables<"invoices">;
export type Service = Tables<"services">;
export type Ticket = Tables<"tickets">;
export type TicketMessage = Tables<"ticket_messages">;
export type Banner = Tables<"banners">;
export type TxtReviewQueue = Tables<"txt_review_queue">;
export type AuditLog = Tables<"audit_log">;