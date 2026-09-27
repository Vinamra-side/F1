import { NextRequest, NextResponse } from "next/server";
import { getTelemetryStore } from "@/lib/telemetry_store";
import { analyzeTelemetryAndGenerateSetup } from "@/lib/engineer_engine";
import { HandlingFeedbackId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const feedback: HandlingFeedbackId[] = body.feedback || [];
    const snapshot = body.snapshot || getTelemetryStore();
    const analysis = analyzeTelemetryAndGenerateSetup(snapshot, feedback);
    return NextResponse.json(analysis);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error analyzing setup";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const feedbackRaw = searchParams.get("feedback");
  const feedback: HandlingFeedbackId[] = feedbackRaw ? (feedbackRaw.split(",") as HandlingFeedbackId[]) : [];
  const snapshot = getTelemetryStore();
  const analysis = analyzeTelemetryAndGenerateSetup(snapshot, feedback);
  return NextResponse.json(analysis);
}
