import domainsConfig from '@/config/domains.json';

export type TldEntry = {
  id: string;
  name: string;
  enabled: boolean;
  envPrefix: string;
  label: string;
  order: number;
  isPrimary: boolean;
};

/**
 * Get all TLD entries from the config
 */
export function getAllTlds(): TldEntry[] {
  return domainsConfig.domains as TldEntry[];
}

/**
 * Get only enabled TLDs, sorted by order
 */
export function getEnabledTlds(): TldEntry[] {
  return getAllTlds()
    .filter(tld => tld.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get a TLD entry by its ID
 */
export function getTldById(id: string): TldEntry | null {
  const tld = getAllTlds().find(t => t.id === id);
  return tld || null;
}

/**
 * Get a TLD entry by its domain name
 */
export function getTldByName(name: string): TldEntry | null {
  const tld = getAllTlds().find(t => t.name === name);
  return tld || null;
}

export type TldEnv = {
  apiToken: string;
  zoneId: string;
  zoneName: string;
};

/**
 * Get environment variables for a TLD
 * @throws Error if required env vars are missing
 */
export function getTldEnv(id: string): TldEnv {
  const tld = getTldById(id);
  if (!tld) {
    throw new Error(`TLD with id "${id}" not found`);
  }

  const prefix = tld.envPrefix;
  const apiToken = process.env[`${prefix}_API_TOKEN`];
  const zoneId = process.env[`${prefix}_ZONE_ID`];
  const zoneName = process.env[`${prefix}_ZONE_NAME`] || tld.name;

  if (!apiToken) {
    throw new Error(`Missing environment variable: ${prefix}_API_TOKEN`);
  }
  if (!zoneId) {
    throw new Error(`Missing environment variable: ${prefix}_ZONE_ID`);
  }

  return {
    apiToken,
    zoneId,
    zoneName,
  };
}