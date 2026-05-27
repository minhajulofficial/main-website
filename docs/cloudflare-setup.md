# Cloudflare Multi-Zone Setup

This project supports one Cloudflare zone per TLD and resolves credentials via `src/config/domains.json` + env vars.

## Add/Bootstrap a Zone

1. Log in to the Cloudflare account that owns the domain.
2. Add the zone (for example `esite.top` or `esite.in`) if not already present.
3. Create an API token with DNS edit permissions for that zone.
4. Copy:
   - Zone ID
   - Zone name
   - API token
5. Set env vars in `.env.local` and Vercel using the domain's `envPrefix`:
   - `<PREFIX>_API_TOKEN`
   - `<PREFIX>_ZONE_ID`
   - `<PREFIX>_ZONE_NAME`

Example for `esite.top`:

```env
CF_ESITE_TOP_API_TOKEN=...
CF_ESITE_TOP_ZONE_ID=...
CF_ESITE_TOP_ZONE_NAME=esite.top
```

> `sites.bd` already exists in the client's personal account; only token + zone ID need to be provided.

## Verify

Run:

```bash
npm run cf:verify
```

The command prints zone info and first DNS records for each enabled TLD.
