// Cloudflare multi-zone factory - implemented in PR-03
// For now, just export placeholder functions

export type CFZone = {
  zoneId: string;
  zoneName: string;
  apiToken: string;
};

// Placeholder - will be implemented in PR-03
export async function getZoneClient(tldId: string) {
  throw new Error("Not implemented - PR-03 will implement");
}