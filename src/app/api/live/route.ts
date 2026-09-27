import { NextResponse } from "next/server";
import { getTelemetryStore } from "@/lib/telemetry_store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getTelemetryStore(), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
