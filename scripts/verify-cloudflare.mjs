import fs from 'node:fs';
import path from 'node:path';

const repo = process.cwd();

function loadEnvLocal() {
  const envPath = path.resolve(repo, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function cfFetch(zoneId, token, pathPart = '', query = '') {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}${pathPart}${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(JSON.stringify(data.errors ?? data));
  return data.result;
}

async function main() {
  loadEnvLocal();
  const domainsPath = path.resolve(repo, 'src/config/domains.json');
  const { domains } = JSON.parse(fs.readFileSync(domainsPath, 'utf8'));
  const enabled = domains.filter((d) => d.enabled).sort((a, b) => a.order - b.order);

  let failed = false;
  for (const tld of enabled) {
    const token = process.env[`${tld.envPrefix}_API_TOKEN`];
    const zoneId = process.env[`${tld.envPrefix}_ZONE_ID`];
    if (!token || !zoneId) {
      failed = true;
      console.error(`[fail] ${tld.id} missing env vars`);
      continue;
    }
    try {
      const zone = await cfFetch(zoneId, token);
      const records = await cfFetch(zoneId, token, '/dns_records', '?per_page=5&page=1');
      console.log(`[ok] ${tld.id} -> ${zone.name} (${zone.status}) NS=${zone.name_servers.join(', ')}`);
      console.log(`     records=${records.length}`);
    } catch (error) {
      failed = true;
      console.error(`[fail] ${tld.id}`, error.message);
    }
  }

  if (failed) process.exit(1);
}

main();
