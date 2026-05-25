// Zone Info API - GET zone details
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
  const logPrefix = `[api dns ${tldId} zone]`;

  console.log(`${logPrefix} GET`);

  try {
    const tld = getTldById(tldId);
    if (!tld || !tld.enabled) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `TLD not found or disabled: ${tldId}` } },
        { status: 404 }
      );
    }

    const client = getCloudflareClient(tldId);
    const zone = await client.getZoneInfo();

    return NextResponse.json({
      data: {
        id: zone.id,
        name: zone.name,
        status: zone.status,
        name_servers: zone.name_servers,
      },
    });
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