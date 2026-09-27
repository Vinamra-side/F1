import { NextRequest, NextResponse } from "next/server";
import { createDefaultSnapshot, setTelemetryStore } from "@/lib/telemetry_store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const driverName = body.driverName || "Vinamra";
    const freshSnapshot = createDefaultSnapshot(driverName);
    setTelemetryStore(freshSnapshot);
    return NextResponse.json({ success: true, message: "Session reset successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error resetting session";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
