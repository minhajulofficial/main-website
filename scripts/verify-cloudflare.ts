// Cloudflare Verification Script - PR-03
// Run: npm run cf:verify

import * as dotenv from "dotenv";
import { getEnabledTlds } from "../src/lib/domains/registry";
import { getCloudflareClient } from "../src/lib/cloudflare/client";

dotenv.config({ path: ".env.local" });

async function main() {
  console.log("🔍 Verifying Cloudflare configuration...\n");

  const tlds = getEnabledTlds();
  let hasErrors = false;

  for (const tld of tlds) {
    console.log(`\n📡 Checking ${tld.name} (${tld.id})...`);

    try {
      const client = getCloudflareClient(tld.id);

      // Get zone info
      const zone = await client.getZoneInfo();
      console.log(`   ✅ Zone: ${zone.name}`);
      console.log(`   ✅ Status: ${zone.status}`);
      console.log(`   ✅ Name Servers: ${zone.name_servers?.join(", ") || "N/A"}`);

      // List first 5 records
      const records = await client.listDnsRecords({ per_page: 5 });
      console.log(`   ✅ Records (first 5): ${records.length}`);
      records.slice(0, 3).forEach((r) => {
        console.log(`      - ${r.type} ${r.name} → ${r.content}`);
      });

      if (records.length > 3) {
        console.log(`      ... and ${records.length - 3} more`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string; tldId?: string; errors?: unknown[] };
      hasErrors = true;
      console.error(`   ❌ Error: ${err.message || "Unknown error"}`);

      // Check for missing env vars
      const envPrefix = tld.envPrefix;
      const apiToken = process.env[`${envPrefix}_API_TOKEN`];
      const zoneId = process.env[`${envPrefix}_ZONE_ID`];

      if (!apiToken) {
        console.error(`   ⚠️  Missing: ${envPrefix}_API_TOKEN`);
      }
      if (!zoneId) {
        console.error(`   ⚠️  Missing: ${envPrefix}_ZONE_ID`);
      }
    }
  }

  console.log("\n" + "=".repeat(50));

  if (hasErrors) {
    console.error("❌ Verification FAILED - check errors above");
    process.exit(1);
  } else {
    console.log("✅ All TLDs verified successfully!");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});