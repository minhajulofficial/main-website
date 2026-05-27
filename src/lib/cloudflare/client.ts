import 'server-only';

import { getEnabledTlds, getTldById, getTldEnv } from '@/lib/domains/registry';
import {
  type CFDnsRecord,
  type CFRecordType,
  type CFZone,
  type CreateDnsInput,
  CloudflareError,
  type UpdateDnsInput,
} from '@/lib/cloudflare/types';

interface ListDnsOptions {
  name?: string;
  type?: string;
  per_page?: number;
  page?: number;
}

export interface CloudflareClient {
  tldId: string;
  zoneId: string;
  zoneName: string;
  listDnsRecords(opts: ListDnsOptions): Promise<CFDnsRecord[]>;
  getDnsRecord(id: string): Promise<CFDnsRecord>;
  createDnsRecord(input: CreateDnsInput): Promise<CFDnsRecord>;
  updateDnsRecord(id: string, input: UpdateDnsInput): Promise<CFDnsRecord>;
  deleteDnsRecord(id: string): Promise<{ id: string }>;
  purgeRecordsBySubdomain(
    fullDomain: string,
    opts: { keepTypes: CFRecordType[]; keepTxtWithNameMatching: RegExp },
  ): Promise<{ deletedIds: string[] }>;
  getZoneInfo(): Promise<CFZone>;
  listSubdomainRecords(subdomain: string): Promise<CFDnsRecord[]>;
}

type CFEnvelope<T> = { success: boolean; errors: unknown[]; result: T };

const cache = new Map<string, CloudflareClient>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function createClient(tldId: string): CloudflareClient {
  const tld = getTldById(tldId);
  if (!tld || !tld.enabled) throw new CloudflareError(tldId, [], 'TLD not found or disabled');
  const env = getTldEnv(tldId);
  const baseUrl = `https://api.cloudflare.com/client/v4/zones/${env.zoneId}`;

  async function cfFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const retries = [200, 600, 1800];
    let lastError: unknown;
    for (let i = 0; i < retries.length; i += 1) {
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.apiToken}`,
            ...(init?.headers ?? {}),
          },
          cache: 'no-store',
        });

        const data = (await res.json()) as CFEnvelope<T>;
        if (res.ok && data.success) return data.result;

        if ((res.status === 429 || res.status >= 500) && i < retries.length - 1) {
          console.warn(`[cloudflare ${tldId}] retry ${i + 1} status=${res.status}`);
          await sleep(retries[i]);
          continue;
        }

        throw new CloudflareError(tldId, data.errors ?? [], `Cloudflare API error (${res.status})`);
      } catch (err) {
        lastError = err;
        if (i < retries.length - 1) {
          console.warn(`[cloudflare ${tldId}] retry ${i + 1} after error`);
          await sleep(retries[i]);
          continue;
        }
      }
    }

    if (lastError instanceof CloudflareError) throw lastError;
    throw new CloudflareError(tldId, [], 'Cloudflare request failed');
  }

  return {
    tldId,
    zoneId: env.zoneId,
    zoneName: env.zoneName,
    listDnsRecords: async (opts) => {
      const qs = new URLSearchParams();
      if (opts.name) qs.set('name', opts.name);
      if (opts.type) qs.set('type', opts.type);
      qs.set('per_page', String(opts.per_page ?? 20));
      qs.set('page', String(opts.page ?? 1));
      return cfFetch<CFDnsRecord[]>(`/dns_records?${qs.toString()}`);
    },
    getDnsRecord: async (id) => cfFetch<CFDnsRecord>(`/dns_records/${id}`),
    createDnsRecord: async (input) => cfFetch<CFDnsRecord>('/dns_records', { method: 'POST', body: JSON.stringify(input) }),
    updateDnsRecord: async (id, input) => cfFetch<CFDnsRecord>(`/dns_records/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    deleteDnsRecord: async (id) => {
      const result = await cfFetch<{ id: string }>(`/dns_records/${id}`, { method: 'DELETE' });
      return { id: result.id };
    },
    purgeRecordsBySubdomain: async (fullDomain, opts) => {
      const records = await cfFetch<CFDnsRecord[]>(`/dns_records?name=${encodeURIComponent(fullDomain)}&per_page=100&page=1`);
      const toDelete = records.filter((r) => {
        if (opts.keepTypes.includes(r.type)) return false;
        if (r.type === 'TXT' && opts.keepTxtWithNameMatching.test(r.name)) return false;
        return true;
      });
      const deletedIds: string[] = [];
      for (const record of toDelete) {
        await cfFetch<{ id: string }>(`/dns_records/${record.id}`, { method: 'DELETE' });
        deletedIds.push(record.id);
      }
      return { deletedIds };
    },
    getZoneInfo: async () => cfFetch<CFZone>(''),
    listSubdomainRecords: async (subdomain) => cfFetch<CFDnsRecord[]>(`/dns_records?name=${encodeURIComponent(subdomain)}&per_page=100&page=1`),
  };
}

export function getCloudflareClient(tldId: string): CloudflareClient {
  const cached = cache.get(tldId);
  if (cached) return cached;
  const created = createClient(tldId);
  cache.set(tldId, created);
  return created;
}

export function getAllCloudflareClients(): CloudflareClient[] {
  return getEnabledTlds().map((tld) => getCloudflareClient(tld.id));
}
