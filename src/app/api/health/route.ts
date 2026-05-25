import { NextResponse } from "next/server";
import { getEnabledTlds } from "@/lib/domains/registry";

export async function GET() {
  return NextResponse.json({
    ok: true,
    tlds: getEnabledTlds().map(t => t.name),
  });
}
