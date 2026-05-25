// Cloudflare API Types - PR-03

export type CFRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";

export interface CFDnsRecord {
  id: string;
  type: CFRecordType;
  name: string;
  content: string;
  ttl: number;
  priority: number;
  proxied: boolean;
  zone_id: string;
  created_on: string;
  modified_on: string;
}

export interface CFZone {
  id: string;
  name: string;
  status: string;
  name_servers: string[];
  paused: boolean;
  type: string;
  account: {
    id: string;
    name: string;
  };
}

export interface CreateDnsInput {
  type: CFRecordType;
  name: string;
  content: string;
  ttl: number;
  priority: number;
  proxied: boolean;
}

export type UpdateDnsInput = Partial<CreateDnsInput>;

export interface CFListResult<T> {
  result: T[];
  result_info: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
  success: boolean;
  errors: unknown[];
  messages: unknown[];
}

export class CloudflareError extends Error {
  constructor(
    public tldId: string,
    public errors: unknown[],
    message: string
  ) {
    super(message);
    this.name = "CloudflareError";
  }
}

export interface CloudflareClient {
  tldId: string;
  zoneId: string;
  zoneName: string;
  listDnsRecords(opts: {
    name?: string;
    type?: string;
    per_page?: number;
    page?: number;
  }): Promise<CFDnsRecord[]>;
  getDnsRecord(id: string): Promise<CFDnsRecord>;
  createDnsRecord(input: CreateDnsInput): Promise<CFDnsRecord>;
  updateDnsRecord(id: string, input: UpdateDnsInput): Promise<CFDnsRecord>;
  deleteDnsRecord(id: string): Promise<{ id: string }>;
  purgeRecordsBySubdomain(
    fullDomain: string,
    opts?: {
      keepTypes?: CFRecordType[];
      keepTxtWithNameMatching?: string;
    }
  ): Promise<{ deletedIds: string[] }>;
  getZoneInfo(): Promise<CFZone>;
  listSubdomainRecords(subdomain: string): Promise<CFDnsRecord[]>;
}