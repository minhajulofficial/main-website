import { NextResponse } from 'next/server';
import { getCloudflareClient } from '@/lib/cloudflare/client';
import { CloudflareError } from '@/lib/cloudflare/types';
import { getTldById } from '@/lib/domains/registry';
import { createServerSupabase } from '@/lib/supabase/server';

export async function requireAdminUser() {
  const supabase = await createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .single();
  if (!profile?.is_admin) return null;
  return userData.user;
}

export async function getDnsContext(tldId: string) {
  const tld = getTldById(tldId);
  if (!tld || !tld.enabled) return null;
  return { tld, client: getCloudflareClient(tldId) };
}

export function errorJson(code: string, message: string, status: number, errors?: unknown[]) {
  return NextResponse.json({ error: { code, message, errors } }, { status });
}

export function fromCloudflareError(err: unknown, tldId: string) {
  if (err instanceof CloudflareError) {
    return errorJson('cloudflare_error', `[api dns ${tldId}] ${err.message}`, 502, err.errors);
  }
  return errorJson('internal_error', `[api dns ${tldId}] Internal server error`, 500);
}
