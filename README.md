# SITES.BD - Free Subdomain Provider

A free multi-TLD subdomain provider built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, and Cloudflare API.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Fill in the required environment variables in `.env.local`:**
   - Add your Cloudflare API tokens, zone IDs for each TLD
   - Add your Supabase URL and keys
   - Configure SMTP settings

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the homepage.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Multi-Domain Architecture

This project supports multiple parent domains (TLDs) for subdomain registration. The TLDs are configured in `src/config/domains.json`.

### How to Add a New Parent Domain

1. **Add entry to `src/config/domains.json`:**
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

2. **Add Cloudflare environment variables to `.env.local` and Vercel:**
   ```
   CF_NEW_TLD_API_TOKEN=
   CF_NEW_TLD_ZONE_ID=
   CF_NEW_TLD_ZONE_NAME=newsite.xyz
   ```

3. **Insert a row into the `tlds` Supabase table** (done in PR-02):
   ```sql
   INSERT INTO tlds (id, name, enabled) VALUES ('new-tld', 'newsite.xyz', true);
   ```

4. **Redeploy** - no code changes required!

## Route Map

| Route | Description | PR |
|-------|-------------|-----|
| `/` | Homepage (ported from legacy) | PR-01 |
| `/login` | User login | PR-06 |
| `/register` | User registration | PR-06 |
| `/forgot-password` | Password reset | PR-06 |
| `/complete-profile` | Profile completion after auth | PR-06 |
| `/check` | Domain availability check | PR-12 |
| `/dash` | User dashboard | PR-07 |
| `/dash/profile` | User profile settings | PR-07 |
| `/domains` | User's domains list | PR-09 |
| `/domains/[fullDomain]` | Domain detail/management | PR-09 |
| `/services` | Available services | PR-10 |
| `/cart` | Shopping cart | PR-11 |
| `/cart/addons` | Cart add-ons | PR-11 |
| `/cart/review` | Cart review before checkout | PR-11 |
| `/invoices` | User invoices | PR-13 |
| `/invoices/[number]` | Invoice detail | PR-13 |
| `/tickets` | Support tickets | PR-14 |
| `/tickets/[number]` | Ticket detail | PR-14 |
| `/admin` | Admin dashboard | PR-22 |
| `/admin/tlds` | TLD registry management | PR-24 |
| `/admin/dns-overwrite` | DNS overwrite tool | PR-24 |
| `/api/health` | Health check endpoint | PR-01 |
| `/api/dns/[tldId]` | DNS API (placeholder) | Future |

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Icons**: Font Awesome (free)
- **Animations**: AOS (Animate On Scroll)
- **Backend**: Supabase (Auth + Postgres + RLS)
- **DNS**: Cloudflare API v4 (multi-zone)
- **Email**: Nodemailer + SMTP
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login, register, etc.)
│   ├── (public)/          # Public routes (check)
│   ├── (user)/            # Protected user routes (dashboard, etc.)
│   ├── (admin)/           # Admin routes
│   └── api/               # API routes
├── config/                # Configuration files
│   ├── domains.json       # TLD registry (single source of truth)
│   ├── hostingPlans.json  # Hosting plans catalog
│   └── addons.json        # Add-ons catalog
├── content/               # User-facing strings
│   └── contentConstants.json
└── lib/                   # Library code
    ├── auth/              # Auth helpers
    ├── cloudflare/        # Cloudflare API client
    ├── domains/           # Domain registry helpers
    ├── email/             # Email sender
    └── supabase/          # Supabase clients
```

## License

Private - All rights reserved.
