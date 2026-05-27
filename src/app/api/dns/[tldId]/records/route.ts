import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fromCloudflareError, getDnsContext, requireAdminUser, errorJson } from '../_utils';

const createSchema = z.object({
  type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']),
  name: z.string().min(1),
  content: z.string().min(1),
  ttl: z.number().int().positive().default(3600),
  priority: z.number().int().optional(),
  proxied: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ tldId: string }> }) {
  const { tldId } = await params;
  if (!(await requireAdminUser())) return errorJson('forbidden', 'Admin access required', 403);
  const ctx = await getDnsContext(tldId);
  if (!ctx) return errorJson('not_found', 'TLD not found or disabled', 404);
  try {
    const url = req.nextUrl;
    const data = await ctx.client.listDnsRecords({
      name: url.searchParams.get('name') ?? undefined,
      type: url.searchParams.get('type') ?? undefined,
      per_page: Number(url.searchParams.get('per_page') ?? 20),
      page: Number(url.searchParams.get('page') ?? 1),
    });
    return NextResponse.json({ data });
  } catch (err) {
    return fromCloudflareError(err, tldId);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tldId: string }> }) {
  const { tldId } = await params;
  if (!(await requireAdminUser())) return errorJson('forbidden', 'Admin access required', 403);
  const ctx = await getDnsContext(tldId);
  if (!ctx) return errorJson('not_found', 'TLD not found or disabled', 404);
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return errorJson('bad_request', 'Invalid payload', 400, parsed.error.issues);
    const data = await ctx.client.createDnsRecord(parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    return fromCloudflareError(err, tldId);
  }
}
