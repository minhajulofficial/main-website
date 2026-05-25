// Purge Records API - POST delete records for subdomain
// Requires admin role

import { NextRequest, NextResponse } from "next/server";
import { getTldById } from "@/lib/domains/registry";
import { getCloudflareClient } from "@/lib/cloudflare/client";
import { CloudflareError } from "@/lib/cloudflare/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tldId: string }> }
) {
  const { tldId } = await params;
  const logPrefix = `[api dns ${tldId} purge]`;

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
    const { fullDomain, keepTypes, keepTxtWithNameMatching } = body;

    if (!fullDomain) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "fullDomain is required" } },
        { status: 400 }
      );
    }

    const client = getCloudflareClient(tldId);
    const result = await client.purgeRecordsBySubdomain(fullDomain, {
      keepTypes,
      keepTxtWithNameMatching,
    });

    console.log(`${logPrefix} Purged ${result.deletedIds.length} records for ${fullDomain}`);
    return NextResponse.json({
      data: {
        fullDomain,
        deletedCount: result.deletedIds.length,
        deletedIds: result.deletedIds,
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