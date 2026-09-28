export interface TyreQuad<T> {
  fl: T;
  fr: T;
  rl: T;
  rr: T;
}

export interface SetupParameters {
  frontWing: number;           // 1 - 11
  rearWing: number;            // 1 - 11
  onThrottleDiff: number;      // 50% - 100%
  offThrottleDiff: number;     // 50% - 100%
  frontCamber: number;         // -3.50 to -2.50 deg
  rearCamber: number;          // -2.00 to -1.00 deg
  frontToe: number;            // 0.05 to 0.15 deg
  rearToe: number;             // 0.20 to 0.52 deg
  frontSuspension: number;     // 1 - 11
  rearSuspension: number;      // 1 - 11
  frontAntiRollBar: number;    // 1 - 11
  rearAntiRollBar: number;     // 1 - 11
  frontRideHeight: number;     // 1 - 11
  rearRideHeight: number;      // 1 - 11
  brakePressure: number;       // 50% - 100%
  brakeBias: number;           // 50% - 70%
  frontLeftTyrePressure: number;  // 21.0 - 25.0 PSI
  frontRightTyrePressure: number; // 21.0 - 25.0 PSI
  rearLeftTyrePressure: number;   // 19.5 - 23.5 PSI
  rearRightTyrePressure: number;  // 19.5 - 23.5 PSI
  ballast?: number;            // 1 - 11
  fuelLoad?: number;           // kg
}

export interface SetupRecommendation {
  category: "Aerodynamics" | "Transmission" | "Suspension Geometry" | "Suspension" | "Brakes" | "Tyres";
  parameter: keyof SetupParameters;
  label: string;
  currentValue: number;
  recommendedValue: number;
  delta: number;
  unit: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
}

export interface LapRecord {
  lapNumber: number;
  lapTime: number;
  lapTimeFormatted: string;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  maxSpeedKmh: number;
  fuelUsedKg: number;
  tyreWear: TyreQuad<number>;
  tyreWearDelta: TyreQuad<number>;
  averageTyreTemps: TyreQuad<number>;
  tyreCompound: string;
  isValid: boolean;
  oversteerEvents?: number;
  understeerEvents?: number;
}

export interface SessionInfo {
  trackName: string;
  trackId?: number;
  weather: string;
  weatherId?: number;
  sessionType: string;
  sessionTypeId?: number;
  airTemperature: number;
  trackTemperature: number;
  totalLaps: number;
}

export interface LiveTelemetry {
  speed: number;
  throttle: number;
  brake: number;
  steer: number;
  gear: number;
  engineRPM: number;
  drs: boolean;
  tyresSurfaceTemperature: TyreQuad<number>;
  tyresInnerTemperature: TyreQuad<number>;
  brakesTemperature: TyreQuad<number>;
  tyresPressure: TyreQuad<number>;
  engineTemperature?: number;
}

export interface LiveMotion {
  gForceLateral: number;
  gForceLongitudinal: number;
  wheelSlip: number[]; // [RL, RR, FL, FR]
  suspensionPosition?: number[];
}

export interface LiveLapData {
  currentLapNum: number;
  currentLapTime: number;
  lastLapTime: number;
  bestLapTime: number;
  sector1TimeMs: number;
  sector2TimeMs: number;
  carPosition: number;
  isCurrentLapInvalid: boolean;
  lapDistance?: number;
}

export interface LiveStatus {
  tyreCompound: string;
  fuelMix?: number;
  fuelInTank: number;
  fuelRemainingLaps: number;
  ersStoreEnergy: number;
  drsAllowed: boolean;
  tyresAgeLaps?: number;
}

export interface LiveDamage {
  tyresWear: TyreQuad<number>;
  frontLeftWingDamage?: number;
  frontRightWingDamage?: number;
  rearWingDamage?: number;
  floorDamage?: number;
}

export interface Participant {
  carIndex: number;
  name: string;
  isAi: boolean;
  driverId: number;
  teamId: number;
  raceNumber: number;
}

export interface Diagnostics {
  oversteerEvents: number;
  understeerEvents: number;
  frontLockingEvents: number;
  rearLockingEvents: number;
  kerbBottomingEvents: number;
}

export interface TelemetrySnapshot {
  driverName: string;
  session: SessionInfo;
  telemetry: LiveTelemetry;
  motion: LiveMotion;
  lapData: LiveLapData;
  status: LiveStatus;
  setup: SetupParameters;
  damage: LiveDamage;
  completedLaps: LapRecord[];
  participants: Participant[];
  diagnostics: Diagnostics;
  timestamp: number;
}

export type HandlingFeedbackId =
  | "oversteer_exit"
  | "understeer_entry"
  | "understeer_mid"
  | "high_speed_snap"
  | "kerb_unstable"
  | "front_locking"
  | "rear_locking"
  | "tyres_overheating"
  | "lacking_top_speed";

export interface HandlingFeedbackItem {
  id: HandlingFeedbackId;
  label: string;
  description: string;
  symptom: string;
}
