// DNS API - GET list records for TLD
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
  const logPrefix = `[api dns ${tldId}]`;

  console.log(`${logPrefix} GET /api/dns/${tldId}`);

  try {
    // Validate TLD exists and is enabled
    const tld = getTldById(tldId);
    if (!tld) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `TLD not found: ${tldId}` } },
        { status: 404 }
      );
    }

    if (!tld.enabled) {
      return NextResponse.json(
        { error: { code: "DISABLED", message: `TLD is disabled: ${tldId}` } },
        { status: 404 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("name") || undefined;
    const type = searchParams.get("type") || undefined;
    const per_page = parseInt(searchParams.get("per_page") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    // Get Cloudflare client for this TLD
    const client = getCloudflareClient(tldId);

    // Fetch records
    const records = await client.listDnsRecords({ name, type, per_page, page });

    return NextResponse.json({
      data: records,
      meta: {
        tldId,
        zoneName: client.zoneName,
        count: records.length,
      },
    });
  } catch (error) {
    if (error instanceof CloudflareError) {
      console.error(`${logPrefix} Cloudflare error:`, error.errors);
      return NextResponse.json(
        {
          error: {
            code: "CLOUDFLARE_ERROR",
            message: error.message,
            errors: error.errors,
          },
        },
        { status: 500 }
      );
    }
    console.error(`${logPrefix} Unexpected error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}