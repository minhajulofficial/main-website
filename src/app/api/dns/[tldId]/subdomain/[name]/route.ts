import { NextRequest, NextResponse } from 'next/server';
import { fromCloudflareError, getDnsContext, requireAdminUser, errorJson } from '../../_utils';

export async function GET(_: NextRequest, { params }: { params: Promise<{ tldId: string; name: string }> }) {
  const { tldId, name } = await params;
  if (!(await requireAdminUser())) return errorJson('forbidden', 'Admin access required', 403);
  const ctx = await getDnsContext(tldId);
  if (!ctx) return errorJson('not_found', 'TLD not found or disabled', 404);
  try {
    const fullDomain = `${name}.${ctx.tld.name}`;
    const data = await ctx.client.listSubdomainRecords(fullDomain);
    return NextResponse.json({ data });
  } catch (err) {
    return fromCloudflareError(err, tldId);
  }
}
