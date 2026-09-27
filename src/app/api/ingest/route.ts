import { NextRequest, NextResponse } from "next/server";
import { setTelemetryStore, getTelemetryStore } from "@/lib/telemetry_store";
import { TelemetrySnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<TelemetrySnapshot>;
    setTelemetryStore(body);
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(getTelemetryStore());
}
