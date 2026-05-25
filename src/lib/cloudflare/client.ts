// Cloudflare Client Factory - PR-03
// Multi-zone support with per-TLD clients

import "server-only";
import { getTldById, getTldEnv, getEnabledTlds } from "@/lib/domains/registry";
import type {
  CFDnsRecord,
  CFZone,
  CreateDnsInput,
  UpdateDnsInput,
  CloudflareClient,
  CFListResult,
  CFRecordType,
} from "./types";
import { CloudflareError } from "./types";

// In-memory cache for client instances per TLD
const clientCache = new Map<string, CloudflareClient>();

const RETRY_DELAYS = [200, 600, 1800]; // ms

function createCloudflareClient(tldId: string): CloudflareClient {
  const tld = getTldById(tldId);
  if (!tld) {
    throw new CloudflareError(tldId, [], `TLD not found: ${tldId}`);
  }

  const env = getTldEnv(tldId);
  const baseUrl = "https://api.cloudflare.com/client/v4";

  // Retry with exponential backoff
  async function cfFetch<T>(
    path: string,
    init?: RequestInit,
    retries = 0
  ): Promise<T> {
    const url = path.startsWith("http")
      ? path
      : `${baseUrl}/zones/${env.zoneId}${path}`;

    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${env.apiToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    // Retry on 429 or 5xx
    if ((response.status === 429 || response.status >= 500) && retries < 3) {
      const delay = RETRY_DELAYS[retries] || 1800;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return cfFetch<T>(path, init, retries + 1);
    }

    const data = (await response.json()) as {
      success: boolean;
      errors?: unknown[];
      result?: T;
      result_info?: unknown;
    };

    if (!response.ok || !data.success) {
      console.error(`[cloudflare ${tldId}] API error:`, data.errors);
      throw new CloudflareError(
        tldId,
        data.errors || [],
        `Cloudflare API error: ${response.statusText}`
      );
    }

    return data.result as T;
  }

  return {
    tldId,
    zoneId: env.zoneId,
    zoneName: env.zoneName,

    async listDnsRecords(opts = {}) {
      const params = new URLSearchParams({
        per_page: String(opts.per_page || 100),
        page: String(opts.page || 1),
      });
      if (opts.name) params.set("name", opts.name);
      if (opts.type) params.set("type", opts.type);

      const data = await cfFetch<CFListResult<CFDnsRecord>>(
        `/dns_records?${params.toString()}`
      );
      return data.result;
    },

    async getDnsRecord(id: string): Promise<CFDnsRecord> {
      return cfFetch<CFDnsRecord>(`/dns_records/${id}`);
    },

    async createDnsRecord(input: CreateDnsInput): Promise<CFDnsRecord> {
      return cfFetch<CFDnsRecord>("/dns_records", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    async updateDnsRecord(
      id: string,
      input: UpdateDnsInput
    ): Promise<CFDnsRecord> {
      return cfFetch<CFDnsRecord>(`/dns_records/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },

    async deleteDnsRecord(id: string): Promise<{ id: string }> {
      await cfFetch(`/dns_records/${id}`, { method: "DELETE" });
      return { id };
    },

    async purgeRecordsBySubdomain(
      fullDomain: string,
      opts?: {
        keepTypes?: CFRecordType[];
        keepTxtWithNameMatching?: string;
      }
    ): Promise<{ deletedIds: string[] }> {
      // List all records for this subdomain
      const records = await this.listSubdomainRecords(fullDomain);
      const deletedIds: string[] = [];

      for (const record of records) {
        // Check keep conditions
        let shouldKeep = false;

        // Keep certain types
        if (opts?.keepTypes?.includes(record.type)) {
          shouldKeep = true;
        }

        // Keep TXT records matching pattern
        if (
          record.type === "TXT" &&
          opts?.keepTxtWithNameMatching &&
          record.name.includes(opts.keepTxtWithNameMatching)
        ) {
          shouldKeep = true;
        }

        if (!shouldKeep) {
          await this.deleteDnsRecord(record.id);
          deletedIds.push(record.id);
        }
      }

      console.log(
        `[cloudflare ${tldId}] Purged ${deletedIds.length} records for ${fullDomain}`
      );
      return { deletedIds };
    },

    async getZoneInfo(): Promise<CFZone> {
      return cfFetch<CFZone>("");
    },

    async listSubdomainRecords(subdomain: string): Promise<CFDnsRecord[]> {
      // Get all records and filter by subdomain name
      const allRecords = await this.listDnsRecords({ per_page: 1000 });
      return allRecords.filter(
        (r) => r.name === subdomain || r.name.endsWith(`.${subdomain}`)
      );
    },
  };
}

/**
 * Returns a Cloudflare client bound to ONE specific TLD zone.
 * Each call reads env via the registry — never share state across TLDs.
 * Cached per-process by tldId for connection reuse.
 */
export function getCloudflareClient(tldId: string): CloudflareClient {
  if (!clientCache.has(tldId)) {
    clientCache.set(tldId, createCloudflareClient(tldId));
  }
  return clientCache.get(tldId)!;
}

/**
 * Returns clients for every ENABLED TLD.
 * Used by multi-TLD search (PR-11) and cleanup crons (PR-23).
 */
export function getAllCloudflareClients(): CloudflareClient[] {
  const tlds = getEnabledTlds();
  return tlds.map((tld) => getCloudflareClient(tld.id));
}

/**
 * Clear the client cache (useful for testing)
 */
export function clearClientCache(): void {
  clientCache.clear();
}

// Re-export types
export type { CFDnsRecord, CFZone, CreateDnsInput, UpdateDnsInput, CloudflareClient, CloudflareError } from "./types";