import { TelemetrySnapshot, LapRecord } from "./types";
import { DEFAULT_TRACK } from "./f1_constants";

// Global singleton in memory (survives hot reloads during serverless lifespan)
declare global {
  // eslint-disable-next-line no-var
  var __F1_TELEMETRY_STORE__: TelemetrySnapshot | undefined;
}

export function createDefaultSnapshot(driverName = "Vinamra"): TelemetrySnapshot {
  const demoLaps: LapRecord[] = [
    {
      lapNumber: 1,
      lapTime: 92.410,
      lapTimeFormatted: "1:32.410",
      sector1: 28.910,
      sector2: 39.420,
      sector3: 24.080,
      maxSpeedKmh: 318,
      fuelUsedKg: 1.84,
      tyreWear: { fl: 4.2, fr: 3.8, rl: 3.1, rr: 3.1 },
      tyreWearDelta: { fl: 4.2, fr: 3.8, rl: 3.1, rr: 3.1 },
      averageTyreTemps: { fl: 99.4, fr: 98.8, rl: 97.2, rr: 97.5 },
      tyreCompound: "Soft",
      isValid: true,
      oversteerEvents: 2,
      understeerEvents: 4,
    },
    {
      lapNumber: 2,
      lapTime: 91.240,
      lapTimeFormatted: "1:31.240",
      sector1: 28.520,
      sector2: 39.110,
      sector3: 23.610,
      maxSpeedKmh: 324,
      fuelUsedKg: 1.82,
      tyreWear: { fl: 8.5, fr: 7.7, rl: 6.2, rr: 6.3 },
      tyreWearDelta: { fl: 4.3, fr: 3.9, rl: 3.1, rr: 3.2 },
      averageTyreTemps: { fl: 102.1, fr: 101.4, rl: 99.8, rr: 100.1 },
      tyreCompound: "Soft",
      isValid: true,
      oversteerEvents: 1,
      understeerEvents: 3,
    },
    {
      lapNumber: 3,
      lapTime: 90.850,
      lapTimeFormatted: "1:30.850",
      sector1: 28.310,
      sector2: 38.920,
      sector3: 23.620,
      maxSpeedKmh: 326,
      fuelUsedKg: 1.81,
      tyreWear: { fl: 13.1, fr: 11.8, rl: 9.4, rr: 9.6 },
      tyreWearDelta: { fl: 4.6, fr: 4.1, rl: 3.2, rr: 3.3 },
      averageTyreTemps: { fl: 105.8, fr: 104.2, rl: 101.5, rr: 102.0 },
      tyreCompound: "Soft",
      isValid: true,
      oversteerEvents: 3,
      understeerEvents: 5,
    },
  ];

  return {
    driverName,
    session: {
      trackName: DEFAULT_TRACK.name,
      trackId: DEFAULT_TRACK.id,
      weather: "Clear",
      weatherId: 0,
      sessionType: "Practice 1",
      airTemperature: 28,
      trackTemperature: 38,
      totalLaps: 20,
    },
    telemetry: {
      speed: 284,
      throttle: 1.0,
      brake: 0.0,
      steer: 0.02,
      gear: 7,
      engineRPM: 12150,
      drs: true,
      tyresSurfaceTemperature: { fl: 104, fr: 102, rl: 99, rr: 100 },
      tyresInnerTemperature: { fl: 106, fr: 104, rl: 101, rr: 102 },
      brakesTemperature: { fl: 480, fr: 470, rl: 390, rr: 395 },
      tyresPressure: { fl: 23.2, fr: 23.1, rl: 21.3, rr: 21.2 },
      engineTemperature: 104,
    },
    motion: {
      gForceLateral: 1.8,
      gForceLongitudinal: 0.6,
      wheelSlip: [0.02, 0.02, 0.01, 0.01],
      suspensionPosition: [0.01, 0.01, 0.02, 0.02],
    },
    lapData: {
      currentLapNum: 4,
      currentLapTime: 42.180,
      lastLapTime: 90.850,
      bestLapTime: 90.850,
      sector1TimeMs: 28310,
      sector2TimeMs: 0,
      carPosition: 1,
      isCurrentLapInvalid: false,
      lapDistance: 2450,
    },
    status: {
      tyreCompound: "Soft",
      fuelInTank: 24.5,
      fuelRemainingLaps: 1.4,
      ersStoreEnergy: 3450000,
      drsAllowed: true,
      tyresAgeLaps: 4,
    },
    setup: { ...DEFAULT_TRACK.baselineSetup },
    damage: {
      tyresWear: { fl: 13.1, fr: 11.8, rl: 9.4, rr: 9.6 },
      frontLeftWingDamage: 0,
      frontRightWingDamage: 0,
      rearWingDamage: 0,
      floorDamage: 0,
    },
    completedLaps: demoLaps,
    participants: [
      { carIndex: 0, name: driverName, isAi: false, driverId: 1, teamId: 0, raceNumber: 44 },
      { carIndex: 1, name: "Max Verstappen", isAi: true, driverId: 2, teamId: 1, raceNumber: 33 },
      { carIndex: 2, name: "Charles Leclerc", isAi: true, driverId: 3, teamId: 2, raceNumber: 16 },
    ],
    diagnostics: {
      oversteerEvents: 4,
      understeerEvents: 7,
      frontLockingEvents: 1,
      rearLockingEvents: 0,
      kerbBottomingEvents: 2,
    },
    timestamp: Date.now(),
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
