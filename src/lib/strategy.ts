import type { SetupRecommendation, TelemetrySnapshot } from "./types";

export type SessionKind = "practice" | "qualifying" | "race" | "time_trial" | "unknown";

export interface SessionBriefing {
  sessionKind: SessionKind;
  sessionLabel: string;
  headline: string;
  pitLabel: string;
  pitCall: string;
  tyreCall: string;
  fuelCall: "Lean" | "Standard" | "Rich";
  rationale: string;
  radioMessage: string;
}

function getSessionKind(snapshot: TelemetrySnapshot): SessionKind {
  const id = snapshot.session.sessionTypeId;
  if (id !== undefined) {
    if (id >= 1 && id <= 4) return "practice";
    if (id >= 5 && id <= 9) return "qualifying";
    if (id === 10 || id === 11) return "race";
    if (id === 12) return "time_trial";
  }

  const name = snapshot.session.sessionType.toLowerCase();
  if (name.includes("practice")) return "practice";
  if (name.includes("qualif")) return "qualifying";
  if (name.includes("race")) return "race";
  if (name.includes("time trial")) return "time_trial";
  return "unknown";
}

function maxTyreWear(snapshot: TelemetrySnapshot): number {
  return Math.max(...Object.values(snapshot.damage.tyresWear));
}

function recentWearPerLap(snapshot: TelemetrySnapshot): number | null {
  const samples = snapshot.completedLaps
    .filter((lap) => lap.isValid)
    .slice(-3)
    .map((lap) => Math.max(...Object.values(lap.tyreWearDelta)))
    .filter((wear) => wear > 0);

  if (samples.length === 0) return null;
  return samples.reduce((total, wear) => total + wear, 0) / samples.length;
}

function nextRaceCompound(snapshot: TelemetrySnapshot, lapsRemaining: number): string {
  const weather = snapshot.session.weatherId ?? 0;
  if (weather >= 4) return "Wet";
  if (weather === 3) return "Intermediate";

  const current = snapshot.status.tyreCompound;
  if (current === "Soft") return "Medium";
  if (current === "Medium") return lapsRemaining <= 8 ? "Soft" : "Hard";
  if (current === "Hard") return lapsRemaining <= 12 ? "Soft" : "Medium";
  return lapsRemaining <= 7 ? "Soft" : lapsRemaining <= 18 ? "Medium" : "Hard";
}

function raceFuelCall(fuelDelta: number, lapsRemaining: number): "Lean" | "Standard" | "Rich" {
  if (fuelDelta < -0.1) return "Lean";
  if (fuelDelta > 1 && lapsRemaining > 3) return "Rich";
  return "Standard";
}

export function buildSessionBriefing(
  snapshot: TelemetrySnapshot,
  balanceLabel: string,
  topSetupRecommendation?: SetupRecommendation
): SessionBriefing {
  const sessionKind = getSessionKind(snapshot);
  const driver = snapshot.driverName || "Driver";
  const setupAction = topSetupRecommendation
    ? `${topSetupRecommendation.label} ${topSetupRecommendation.delta > 0 ? "+" : ""}${topSetupRecommendation.delta} ${topSetupRecommendation.unit}`
    : "keep the current setup";

  if (sessionKind === "practice") {
    const cleanLapsNeeded = Math.max(0, 2 - snapshot.completedLaps.filter((lap) => lap.isValid).length);
    const pitCall = cleanLapsNeeded > 0
      ? `Stay out for ${cleanLapsNeeded} clean ${cleanLapsNeeded === 1 ? "lap" : "laps"}`
      : "Box when ready to compare setup";
    return {
      sessionKind,
      sessionLabel: snapshot.session.sessionType,
      headline: "Build a clean setup baseline",
      pitLabel: "Run plan",
      pitCall,
      tyreCall: `Stay on ${snapshot.status.tyreCompound}`,
      fuelCall: "Standard",
      rationale: `${balanceLabel}. Next setup action: ${setupAction}.`,
      radioMessage: `${driver}, practice programme. ${pitCall}. Fuel standard. ${balanceLabel}; ${setupAction}.`,
    };
  }

  if (sessionKind === "qualifying") {
    const invalid = snapshot.lapData.isCurrentLapInvalid;
    const pitCall = invalid ? "Abort lap, recharge, then box" : "Prepare tyres, then push";
    return {
      sessionKind,
      sessionLabel: snapshot.session.sessionType,
      headline: invalid ? "Reset for the next qualifying run" : "One clean push lap",
      pitLabel: "Run call",
      pitCall,
      tyreCall: "Soft for the push lap",
      fuelCall: "Rich",
      rationale: invalid
        ? "This lap is invalid; protect the tyres and battery for the next attempt."
        : "Use the preparation lap to build tyre temperature before committing.",
      radioMessage: `${driver}, qualifying mode. ${pitCall}. Soft tyres, rich fuel for the push lap.`,
    };
  }

  if (sessionKind === "race") {
    const currentLap = Math.max(1, snapshot.lapData.currentLapNum);
    const totalLaps = Math.max(currentLap, snapshot.session.totalLaps);
    const lapsRemaining = Math.max(0, totalLaps - currentLap);
    const wear = maxTyreWear(snapshot);
    const wearPerLap = recentWearPerLap(snapshot);
    const peakTemp = Math.max(...Object.values(snapshot.telemetry.tyresInnerTemperature));
    const wingDamage = Math.max(
      snapshot.damage.frontLeftWingDamage ?? 0,
      snapshot.damage.frontRightWingDamage ?? 0
    );

    let pitCall = "Stay out — no stop needed yet";
    let pitReason = `Peak wear ${Math.round(wear)}%`;
    if (wear >= 70 || peakTemp >= 112 || wingDamage >= 35) {
      pitCall = "Box this lap";
      pitReason = wear >= 70
        ? `Peak tyre wear is ${Math.round(wear)}%`
        : peakTemp >= 112
          ? `Tyre temperature is ${Math.round(peakTemp)}°C`
          : `Front-wing damage is ${Math.round(wingDamage)}%`;
    } else if (wearPerLap && lapsRemaining > 2) {
      const safeLaps = Math.max(0, Math.floor((70 - wear) / wearPerLap));
      if (safeLaps <= 2) {
        pitCall = "Box this lap";
      } else if (safeLaps < lapsRemaining) {
        const windowStart = Math.min(totalLaps - 1, currentLap + Math.max(1, safeLaps - 2));
        const windowEnd = Math.min(totalLaps - 1, windowStart + 2);
        pitCall = windowStart === windowEnd ? `Pit on lap ${windowStart}` : `Pit window: laps ${windowStart}–${windowEnd}`;
      }
      pitReason = `${Math.round(wear)}% wear, rising about ${wearPerLap.toFixed(1)}% per lap`;
    }

    const tyreCall = nextRaceCompound(snapshot, lapsRemaining);
    const fuelDelta = snapshot.status.fuelRemainingLaps - lapsRemaining;
    const fuelCall = raceFuelCall(fuelDelta, lapsRemaining);
    const fuelReason = fuelCall === "Lean"
      ? `fuel delta ${fuelDelta.toFixed(1)} laps`
      : fuelCall === "Rich"
        ? `fuel surplus ${fuelDelta.toFixed(1)} laps`
        : "fuel is on target";

    return {
      sessionKind,
      sessionLabel: snapshot.session.sessionType,
      headline: pitCall,
      pitLabel: "Pit call",
      pitCall,
      tyreCall,
      fuelCall,
      rationale: `${pitReason}; ${fuelReason}. Strategy updates each lap from live wear and fuel.`,
      radioMessage: `${driver}, ${pitCall.toLowerCase()}. Fit ${tyreCall}. Fuel mix ${fuelCall.toLowerCase()}. ${pitReason}.`,
    };
  }

  return {
    sessionKind,
    sessionLabel: snapshot.session.sessionType,
    headline: sessionKind === "time_trial" ? "Focus on a clean benchmark lap" : "Waiting for session context",
    pitLabel: "Run call",
    pitCall: "Stay out",
    tyreCall: `Current ${snapshot.status.tyreCompound}`,
    fuelCall: "Standard",
    rationale: `${balanceLabel}. Live setup analysis remains active.`,
    radioMessage: `${driver}, telemetry received. ${balanceLabel}. Keep the current run clean.`,
  };
}
