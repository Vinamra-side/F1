import type { TelemetrySnapshot } from '@/lib/types';
import trackInfo from '@/lib/trackInfo.json';

/**
 * Very simple rule‑based suggestion engine.
 * It receives the latest telemetry snapshot and the current track identifier
 * (snapshot.trackId) and returns an array of human‑readable hints.
 */
export function generateSetupHints(snapshot: TelemetrySnapshot): string[] {
  const hints: string[] = [];

  // Guard against missing fields
  if (!snapshot || !snapshot.trackId) return hints;

  const track = (trackInfo as any)[snapshot.trackId];
  if (!track) return hints;

  // --- Example heuristic 1: long straights → lower front wing
  if (track.longStraights > 1 && snapshot.car && snapshot.car.frontWing !== undefined) {
    if (snapshot.car.frontWing > 5) {
      hints.push('Lower front wing by ~2° to increase top‑speed on long straights.');
    }
  }

  // --- Example heuristic 2: high average corner speed → add rear wing
  if (track.averageCornerSpeed > 115 && snapshot.car && snapshot.car.rearWing !== undefined) {
    if (snapshot.car.rearWing < 10) {
      hints.push('Increase rear wing by ~2° for better corner grip.');
    }
  }

  // --- Example heuristic 3: tyre temperature extremes
  if (snapshot.tyreTemperatures) {
    const { frontLeft, frontRight, rearLeft, rearRight } = snapshot.tyreTemperatures as any;
    if (frontLeft && frontLeft > 100) {
      hints.push('Front‑left tyre is hot – consider reducing front camber or brake bias.');
    }
    if (frontRight && frontRight > 100) {
      hints.push('Front‑right tyre is hot – consider reducing front camber or brake bias.');
    }
    if (rearLeft && rearLeft > 95) {
      hints.push('Rear‑left tyre is hot – lower rear camber slightly.');
    }
    if (rearRight && rearRight > 95) {
      hints.push('Rear‑right tyre is hot – lower rear camber slightly.');
    }
  }

  // --- Example heuristic 4: average speed vs. lap time
  if (snapshot.lapTime && snapshot.averageSpeed) {
    // Rough rule: if average speed is low for this track, suggest lower drag
    if (track.averageCornerSpeed && snapshot.averageSpeed < track.averageCornerSpeed * 0.9) {
      hints.push('Overall speed is low – try a lower down‑force setup (reduce both wings).');
    }
  }

  return hints;
}
