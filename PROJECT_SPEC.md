# SITES.BD - Project Specification

## 0. Project Baseline

### 0.1 Repos & Deployment
- Working repo: https://github.com/minhajulofficial/main-website
- Working Vercel preview: https://sites-bd-work.vercel.app/
- Production domains (final swap done by client): sites.bd, esite.top, esite.in
- Testing domain: esite.top

### 0.2 Current State
- PR-01 completed: Next.js init + homepage port
- Route structure established
- Multi-domain registry configured

### 0.3 Domain Model (CRITICAL)
Multi-TLD subdomain provider. Each parent domain is a separate Cloudflare zone.

**TLD Registry (src/config/domains.json):**
- sites.bd (primary)
- esite.top
- esite.in

Adding a new TLD = JSON config + env vars + DB row, no code changes.

### 0.4 Routes
| Route | Purpose |
|-------|---------|
| `/` | Public homepage |
| `/login` | User login |
| `/register` | User registration |
| `/forgot-password` | Password reset |
| `/complete-profile` | Profile completion |
| `/check` | Domain availability search |
| `/dash` | User dashboard |
| `/domains` | User's domains |
| `/services` | User's services |
| `/cart` | Cart + checkout |
| `/invoices` | Invoices |
| `/tickets` | Support tickets |
| `/admin` | Admin panel |

### 0.5 Stack
- Next.js 14+ (App Router)
- TypeScript (strict)
- React 18 + Tailwind CSS + AOS + Font Awesome free
- Supabase (Postgres + Auth + RLS)
- Cloudflare API v4 (multi-zone)
- Nodemailer + SMTP
- Vercel deployment

---

## 1. Common Conventions

### 1.1 Branch & PR Naming
- Branch: `devin/<unix-timestamp>-<short-slug>`
- PR: `[PR-XX] <descriptive title>`

### 1.2 Code Quality Rules
- TypeScript strict — no `any`
- Server-side validation always
- Secrets in `.env` (gitignored) + `.env.example` (committed)
- All user-facing strings in `src/content/contentConstants.json`
- All config in `src/config/*.json` (not hardcoded)
- Every Supabase table must have RLS enabled
- Every API route must validate session and verify ownership

### 1.3 Security Guards
- API keys: server-side only, never in client bundle
- All API routes use Supabase server client with JWT
- Double-check `user_id` ownership against resource
- Force-logout on suspend via session table invalidation

### 1.4 Style
- Tailwind utility classes, no inline styles
- AOS (free) for scroll animations
- Font Awesome free CDN
- Mobile-first responsive

---

## 2. PR Dependency Graph

```
[01 Next.js Init + Port homepage] → [02 Supabase Schema + tlds table] → [03 Multi-Zone Cloudflare Service] → [04 Auth Foundation]
                                                                                                                              ↓
[05 Register] [06 Login] [07 Forgot Pwd] (parallel after 04)
           ↓
[08 Dashboard Shell (/dash)] → [09 Dashboard Home] → [10 Banner CMS Admin]
           ↓
[11 Multi-TLD Domain Search API] → [12 /check UI + Whois] → [13 Claim Flow]
           ↓
[14 Cart] → [15 /cart Step 1] → [16 /cart/addons + /cart/review] → [17 /invoices + WhatsApp]
           ↓
[18 /domains + status] → [19 NS Mode] → [20 Manual DNS Mode] → [21 TXT Engine]
           ↓
[22 /tickets (user+admin)]
           ↓
[23 Cron Jobs + Cascade (multi-zone)]
           ↓
[24 Admin User Mgmt + TLD Registry] → [25 Admin Service Provisioning] → [26 Admin DNS Overwrite] → [27 Admin Verification + TXT Review]
           ↓
[28 Polish + contentConstants + QA]
```

Total: 28 PRs. Dependency order must be maintained.

---

## 3. Multi-Domain Registry

### src/config/domains.json
```json
{
  "domains": [
    { "id": "sites-bd", "name": "sites.bd", "enabled": true, "envPrefix": "CF_SITES_BD", "label": "sites.bd", "order": 1 },
    { "id": "esite-top", "name": "esite.top", "enabled": true, "envPrefix": "CF_ESITE_TOP", "label": "esite.top", "order": 2 },
    { "id": "esite-in", "name": "esite.in", "enabled": true, "envPrefix": "CF_ESITE_IN", "label": "esite.in", "order": 3 }
  ]
}
```

### Required env vars per TLD
- `<PREFIX>_API_TOKEN`
- `<PREFIX>_ZONE_ID`
- `<PREFIX>_ZONE_NAME`

### DNS API routes
- `/api/dns/[tldId]/records`
- `/api/dns/[tldId]/zone`
- `/api/dns/[tldId]/ns`
- `/api/dns/[tldId]/txt`

### Cloudflare client factory
`getCloudflareClient(tldId)` returns client bound to that TLD's token+zone.

---

## 4. Cloudflare Credentials (Client Provided)

```
CF_SITES_BD_API_TOKEN=cfut_...
CF_SITES_BD_ZONE_ID=9763ee23...
CF_SITES_BD_ZONE_NAME=sites.bd
```

Client will provide equivalent for esite.top and esite.in.