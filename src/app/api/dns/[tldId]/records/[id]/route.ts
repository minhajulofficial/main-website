import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fromCloudflareError, getDnsContext, requireAdminUser, errorJson } from '../../_utils';

const patchSchema = z.object({
  type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']).optional(),
  name: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  ttl: z.number().int().positive().optional(),
  priority: z.number().int().optional(),
  proxied: z.boolean().optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ tldId: string; id: string }> }) {
  const { tldId, id } = await params;
  if (!(await requireAdminUser())) return errorJson('forbidden', 'Admin access required', 403);
  const ctx = await getDnsContext(tldId);
  if (!ctx) return errorJson('not_found', 'TLD not found or disabled', 404);
  try {
    const data = await ctx.client.getDnsRecord(id);
    return NextResponse.json({ data });
  } catch (err) {
    return fromCloudflareError(err, tldId);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tldId: string; id: string }> }) {
  const { tldId, id } = await params;
  if (!(await requireAdminUser())) return errorJson('forbidden', 'Admin access required', 403);
  const ctx = await getDnsContext(tldId);
  if (!ctx) return errorJson('not_found', 'TLD not found or disabled', 404);
  try {
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return errorJson('bad_request', 'Invalid payload', 400, parsed.error.issues);
    const data = await ctx.client.updateDnsRecord(id, parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    return fromCloudflareError(err, tldId);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ tldId: string; id: string }> }) {
  const { tldId, id } = await params;
  if (!(await requireAdminUser())) return errorJson('forbidden', 'Admin access required', 403);
  const ctx = await getDnsContext(tldId);
  if (!ctx) return errorJson('not_found', 'TLD not found or disabled', 404);
  try {
    const data = await ctx.client.deleteDnsRecord(id);
    return NextResponse.json({ data });
  } catch (err) {
    return fromCloudflareError(err, tldId);
  }
}
