import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fromCloudflareError, getDnsContext, requireAdminUser, errorJson } from '../_utils';

const schema = z.object({
  fullDomain: z.string().min(1),
  keepTypes: z.array(z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'])).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ tldId: string }> }) {
  const { tldId } = await params;
  if (!(await requireAdminUser())) return errorJson('forbidden', 'Admin access required', 403);
  const ctx = await getDnsContext(tldId);
  if (!ctx) return errorJson('not_found', 'TLD not found or disabled', 404);
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return errorJson('bad_request', 'Invalid payload', 400, parsed.error.issues);
    const data = await ctx.client.purgeRecordsBySubdomain(parsed.data.fullDomain, {
      keepTypes: parsed.data.keepTypes ?? ['NS'],
      keepTxtWithNameMatching: /^_acme-challenge\./,
    });
    return NextResponse.json({ data });
  } catch (err) {
    return fromCloudflareError(err, tldId);
  }
}
