// DNS Records API - GET list, POST create
// Requires admin role

import { NextRequest, NextResponse } from "next/server";
import { getTldById } from "@/lib/domains/registry";
import { getCloudflareClient } from "@/lib/cloudflare/client";
import { CloudflareError } from "@/lib/cloudflare/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tldId: string }> }
) {
  const { tldId } = await params;
  const logPrefix = `[api dns ${tldId} records]`;

  console.log(`${logPrefix} GET`);

  try {
    const tld = getTldById(tldId);
    if (!tld || !tld.enabled) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `TLD not found or disabled: ${tldId}` } },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("name") || undefined;
    const type = searchParams.get("type") || undefined;
    const per_page = parseInt(searchParams.get("per_page") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    const client = getCloudflareClient(tldId);
    const records = await client.listDnsRecords({ name, type, per_page, page });

    return NextResponse.json({ data: records });
  } catch (error) {
    if (error instanceof CloudflareError) {
      return NextResponse.json(
        { error: { code: "CLOUDFLARE_ERROR", message: error.message } },
        { status: 500 }
      );
    }
    console.error(`${logPrefix} Error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tldId: string }> }
) {
  const { tldId } = await params;
  const logPrefix = `[api dns ${tldId} records]`;

  console.log(`${logPrefix} POST`);

  try {
    const tld = getTldById(tldId);
    if (!tld || !tld.enabled) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `TLD not found or disabled: ${tldId}` } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, name, content, ttl, priority, proxied } = body;

    if (!type || !name || !content) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "type, name, and content are required" } },
        { status: 400 }
      );
    }

    const client = getCloudflareClient(tldId);
    const record = await client.createDnsRecord({
      type,
      name,
      content,
      ttl: ttl || 3600,
      priority: priority || 0,
      proxied: proxied ?? true,
    });

    console.log(`${logPrefix} Created record: ${record.id}`);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    if (error instanceof CloudflareError) {
      return NextResponse.json(
        { error: { code: "CLOUDFLARE_ERROR", message: error.message } },
        { status: 500 }
      );
    }
    console.error(`${logPrefix} Error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}