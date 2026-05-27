export type CFRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';

export interface CFDnsRecord {
  id: string;
  type: CFRecordType;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied?: boolean;
  zone_id: string;
  created_on: string;
  modified_on: string;
}

export interface CFZone {
  id: string;
  name: string;
  status: string;
  name_servers: string[];
}

export interface CreateDnsInput {
  type: CFRecordType;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied?: boolean;
}

export type UpdateDnsInput = Partial<CreateDnsInput>;

export class CloudflareError extends Error {
  constructor(
    public tldId: string,
    public errors: unknown[],
    message: string,
  ) {
    super(message);
    this.name = 'CloudflareError';
  }
}
