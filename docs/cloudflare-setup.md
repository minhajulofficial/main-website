# Cloudflare Setup Guide - PR-03

This document describes how to set up Cloudflare zones and API tokens for each TLD.

## Overview

SITES.BD manages multiple TLDs (Top-Level Domains). Each TLD is a separate Cloudflare zone with its own:
- API Token
- Zone ID
- Zone Name

## Zones

| TLD | Account | Notes |
|-----|---------|-------|
| `sites.bd` | Client's personal CF account | Read/write via provided token |
| `esite.top` | Shared CF account | Full management |
| `esite.in` | Shared CF account | Full management |

## Setup Steps

### 1. Log into Cloudflare

Go to https://dash.cloudflare.com and log in to the appropriate account.

### 2. Add Zone (for esite.top and esite.in if not already exists)

For each new domain:

1. **Select Account** - Choose the correct Cloudflare account
2. **Add a Site** - Enter the domain name (e.g., `esite.top`)
3. **Select Plan** - Choose free plan (sufficient for DNS management)
4. **Update DNS** - Cloudflare will give you name servers to update
5. **Verify** - Wait for DNS propagation

### 3. Get Zone ID

1. Select the domain in Cloudflare dashboard
2. Go to **Overview** page
3. Find **Zone ID** on the right sidebar
4. Copy this value

### 4. Create API Token

1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use **Edit Zone DNS** template (or create custom)
4. Set permissions:
   - `Zone → DNS → Edit`
   - `Zone → Zone → Read`
5. Select specific zones or use template
6. Copy the generated token

**Note:** For sites.bd (client's account), the client has provided the token directly.

### 5. Add Environment Variables

Update `.env.local` (local) and Vercel Environment Variables:

```bash
# sites.bd
CF_SITES_BD_API_TOKEN=your-token-here
CF_SITES_BD_ZONE_ID=your-zone-id-here
CF_SITES_BD_ZONE_NAME=sites.bd

# esite.top
CF_ESITE_TOP_API_TOKEN=your-token-here
CF_ESITE_TOP_ZONE_ID=your-zone-id-here
CF_ESITE_TOP_ZONE_NAME=esite.top

# esite.in
CF_ESITE_IN_API_TOKEN=your-token-here
CF_ESITE_IN_ZONE_ID=your-zone-id-here
CF_ESITE_IN_ZONE_NAME=esite.in
```

### 6. Update Database

After adding a new TLD:

1. Insert row into `tlds` table:
```sql
INSERT INTO tlds (slug, name, env_prefix, cloudflare_zone_id, enabled, is_primary, display_order, label)
VALUES ('new-tld', 'newsite.xyz', 'CF_NEW_TLD', 'zone-id-here', true, false, 4, 'newsite.xyz');
```

2. Add config in `src/config/domains.json`:
```json
{
  "id": "new-tld",
  "name": "newsite.xyz",
  "enabled": true,
  "envPrefix": "CF_NEW_TLD",
  "label": "newsite.xyz",
  "order": 4,
  "isPrimary": false
}
```

3. Add env vars (step 5 above)

4. Redeploy - no code changes required!

## Verification

Run the verification script:

```bash
npm install
npm run cf:verify
```

This will:
- Check each TLD's credentials
- Verify API connectivity
- Print zone info and name servers

## Troubleshooting

### Token is invalid
- Verify token has correct permissions
- Check token hasn't expired
- Ensure correct account is used

### Zone ID wrong
- Zone ID is specific to each zone
- Get from domain's Overview page in Cloudflare

### DNS not propagating
- Wait 24-48 hours for initial propagation
- Check name servers are correctly set
- Use `dig NS domain.com` to verify

## Security Notes

- **Never** commit tokens to git
- API tokens should have minimum required permissions
- Rotate tokens periodically
- Use separate tokens for production and development

## References

- [Cloudflare API Tokens](https://developers.cloudflare.com/api/tokens/create)
- [Cloudflare Zones API](https://developers.cloudflare.com/api/operations/zones-get)
- [Cloudflare DNS API](https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records)