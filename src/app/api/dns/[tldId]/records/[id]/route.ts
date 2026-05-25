// DNS Record by ID - GET, PATCH, DELETE
// Requires admin role

import { NextRequest, NextResponse } from "next/server";
import { getTldById } from "@/lib/domains/registry";
import { getCloudflareClient } from "@/lib/cloudflare/client";
import { CloudflareError } from "@/lib/cloudflare/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tldId: string; id: string }> }
) {
  const { tldId, id } = await params;
  const logPrefix = `[api dns ${tldId} records/${id}]`;

  try {
    const tld = getTldById(tldId);
    if (!tld || !tld.enabled) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `TLD not found or disabled: ${tldId}` } },
        { status: 404 }
      );
    }

    const client = getCloudflareClient(tldId);
    const record = await client.getDnsRecord(id);

    return NextResponse.json({ data: record });
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tldId: string; id: string }> }
) {
  const { tldId, id } = await params;
  const logPrefix = `[api dns ${tldId} records/${id}]`;

  try {
    const tld = getTldById(tldId);
    if (!tld || !tld.enabled) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `TLD not found or disabled: ${tldId}` } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const client = getCloudflareClient(tldId);
    const record = await client.updateDnsRecord(id, body);

    console.log(`${logPrefix} Updated record`);
    return NextResponse.json({ data: record });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tldId: string; id: string }> }
) {
  const { tldId, id } = await params;
  const logPrefix = `[api dns ${tldId} records/${id}]`;

  try {
    const tld = getTldById(tldId);
    if (!tld || !tld.enabled) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `TLD not found or disabled: ${tldId}` } },
        { status: 404 }
      );
    }

    const client = getCloudflareClient(tldId);
    const result = await client.deleteDnsRecord(id);

    console.log(`${logPrefix} Deleted record`);
    return NextResponse.json({ data: result });
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