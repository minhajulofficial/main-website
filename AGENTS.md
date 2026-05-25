<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## SITES.BD Project Rules

### Vercel Free Plan - PR Only
- Direct push to main branch → BLOCKED by Vercel
- ALWAYS create PR for changes, owner merges → auto deploy
- Branch naming: `devin/<unix-timestamp>-<short-slug>`

### Multi-Domain Architecture
- TLDs in `src/config/domains.json` (single source of truth)
- Each TLD = Cloudflare zone + API token + zone ID
- Add new TLD = JSON + env vars + DB row only, no code changes
- `getCloudflareClient(tldId)` factory for multi-zone support

### Code Quality
- TypeScript strict — no `any`
- User-facing strings → `src/content/contentConstants.json`
- Config → `src/config/*.json`
- API routes validate session + verify ownership

### Security
- API keys: server-side only, never in client bundle
- Supabase server client with JWT for all API routes

### Current PR
PR-01 completed: Next.js init + homepage port
