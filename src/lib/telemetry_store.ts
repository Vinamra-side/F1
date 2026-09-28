import { TelemetrySnapshot } from "./types";
import { DEFAULT_TRACK } from "./f1_constants";

// Global singleton in memory (survives hot reloads during serverless lifespan)
declare global {
  var __F1_TELEMETRY_STORE__: TelemetrySnapshot | undefined;
}

export function createDefaultSnapshot(driverName = "Vinamra"): TelemetrySnapshot {
  return {
    driverName,
    session: {
      trackName: "Waiting for telemetry",
      trackId: -1,
      weather: "Unknown",
      weatherId: 0,
      sessionType: "No live session",
      sessionTypeId: 0,
      airTemperature: 0,
      trackTemperature: 0,
      totalLaps: 0,
    },
    telemetry: {
      speed: 0,
      throttle: 0,
      brake: 0,
      steer: 0,
      gear: 0,
      engineRPM: 0,
      drs: false,
      tyresSurfaceTemperature: { fl: 0, fr: 0, rl: 0, rr: 0 },
      tyresInnerTemperature: { fl: 0, fr: 0, rl: 0, rr: 0 },
      brakesTemperature: { fl: 0, fr: 0, rl: 0, rr: 0 },
      tyresPressure: { fl: 0, fr: 0, rl: 0, rr: 0 },
      engineTemperature: 0,
    },
    motion: {
      gForceLateral: 0,
      gForceLongitudinal: 0,
      wheelSlip: [0, 0, 0, 0],
      suspensionPosition: [0, 0, 0, 0],
    },
    lapData: {
      currentLapNum: 0,
      currentLapTime: 0,
      lastLapTime: 0,
      bestLapTime: 0,
      sector1TimeMs: 0,
      sector2TimeMs: 0,
      carPosition: 0,
      isCurrentLapInvalid: false,
      lapDistance: 0,
    },
    status: {
      tyreCompound: "Unknown",
      fuelMix: 1,
      fuelInTank: 0,
      fuelRemainingLaps: 0,
      ersStoreEnergy: 0,
      drsAllowed: false,
      tyresAgeLaps: 0,
    },
    setup: { ...DEFAULT_TRACK.baselineSetup },
    damage: {
      tyresWear: { fl: 0, fr: 0, rl: 0, rr: 0 },
      frontLeftWingDamage: 0,
      frontRightWingDamage: 0,
      rearWingDamage: 0,
      floorDamage: 0,
    },
    completedLaps: [],
    participants: [],
    diagnostics: {
      oversteerEvents: 0,
      understeerEvents: 0,
      frontLockingEvents: 0,
      rearLockingEvents: 0,
      kerbBottomingEvents: 0,
    },
    timestamp: 0,
  };
}

export function getTelemetryStore(): TelemetrySnapshot {
  if (!global.__F1_TELEMETRY_STORE__) {
    global.__F1_TELEMETRY_STORE__ = createDefaultSnapshot();
  }
  return global.__F1_TELEMETRY_STORE__;
}

export function setTelemetryStore(data: Partial<TelemetrySnapshot>) {
  const current = getTelemetryStore();
  global.__F1_TELEMETRY_STORE__ = {
    ...current,
    ...data,
    timestamp: Date.now(),
  };
}
