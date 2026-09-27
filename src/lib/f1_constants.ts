import { SetupParameters, HandlingFeedbackItem } from "./types";

export interface TrackMetadata {
  id: number;
  name: string;
  country: string;
  downforceTier: "Maximum" | "High" | "Medium" | "Low" | "Very Low";
  tyreWear: "Low" | "Medium" | "High" | "Extreme";
  tractionDemand: "High" | "Medium" | "Low";
  brakingDemand: "Heavy" | "Medium" | "Light";
  typicalLapTime: string;
  baselineSetup: SetupParameters;
}

export const F1_TRACKS: Record<number, TrackMetadata> = {
  0: {
    id: 0,
    name: "Melbourne (Albert Park)",
    country: "Australia",
    downforceTier: "Medium",
    tyreWear: "Medium",
    tractionDemand: "High",
    brakingDemand: "Heavy",
    typicalLapTime: "1:21.500",
    baselineSetup: {
      frontWing: 6, rearWing: 8, onThrottleDiff: 65, offThrottleDiff: 55,
      frontCamber: -2.80, rearCamber: -1.60, frontToe: 0.08, rearToe: 0.32,
      frontSuspension: 5, rearSuspension: 4, frontAntiRollBar: 6, rearAntiRollBar: 4,
      frontRideHeight: 4, rearRideHeight: 5, brakePressure: 95, brakeBias: 55,
      frontLeftTyrePressure: 23.0, frontRightTyrePressure: 23.0, rearLeftTyrePressure: 21.0, rearRightTyrePressure: 21.0
    }
  },
  1: {
    id: 1,
    name: "Circuit Paul Ricard",
    country: "France",
    downforceTier: "Medium",
    tyreWear: "Medium",
    tractionDemand: "Medium",
    brakingDemand: "Medium",
    typicalLapTime: "1:32.000",
    baselineSetup: {
      frontWing: 6, rearWing: 6, onThrottleDiff: 75, offThrottleDiff: 58,
      frontCamber: -2.70, rearCamber: -1.50, frontToe: 0.09, rearToe: 0.35,
      frontSuspension: 6, rearSuspension: 5, frontAntiRollBar: 7, rearAntiRollBar: 5,
      frontRideHeight: 3, rearRideHeight: 4, brakePressure: 95, brakeBias: 56,
      frontLeftTyrePressure: 23.4, frontRightTyrePressure: 23.4, rearLeftTyrePressure: 21.4, rearRightTyrePressure: 21.4
    }
  },
  2: {
    id: 2,
    name: "Shanghai International Circuit",
    country: "China",
    downforceTier: "Medium",
    tyreWear: "High",
    tractionDemand: "High",
    brakingDemand: "Heavy",
    typicalLapTime: "1:33.200",
    baselineSetup: {
      frontWing: 6, rearWing: 7, onThrottleDiff: 68, offThrottleDiff: 56,
      frontCamber: -2.90, rearCamber: -1.60, frontToe: 0.08, rearToe: 0.32,
      frontSuspension: 5, rearSuspension: 5, frontAntiRollBar: 7, rearAntiRollBar: 5,
      frontRideHeight: 3, rearRideHeight: 4, brakePressure: 95, brakeBias: 56,
      frontLeftTyrePressure: 23.0, frontRightTyrePressure: 23.0, rearLeftTyrePressure: 21.0, rearRightTyrePressure: 21.0
    }
  },
  3: {
    id: 3,
    name: "Bahrain International Circuit (Sakhir)",
    country: "Bahrain",
    downforceTier: "Medium",
    tyreWear: "Extreme",
    tractionDemand: "High",
    brakingDemand: "Heavy",
    typicalLapTime: "1:30.500",
    baselineSetup: {
      frontWing: 7, rearWing: 6, onThrottleDiff: 70, offThrottleDiff: 55,
      frontCamber: -2.80, rearCamber: -1.50, frontToe: 0.09, rearToe: 0.32,
      frontSuspension: 7, rearSuspension: 6, frontAntiRollBar: 8, rearAntiRollBar: 6,
      frontRideHeight: 3, rearRideHeight: 4, brakePressure: 95, brakeBias: 56,
      frontLeftTyrePressure: 23.0, frontRightTyrePressure: 23.0, rearLeftTyrePressure: 21.0, rearRightTyrePressure: 21.0
    }
  },
  4: {
    id: 4,
    name: "Circuit de Barcelona-Catalunya",
    country: "Spain",
    downforceTier: "High",
    tyreWear: "High",
    tractionDemand: "High",
    brakingDemand: "Medium",
    typicalLapTime: "1:18.200",
    baselineSetup: {
      frontWing: 8, rearWing: 8, onThrottleDiff: 68, offThrottleDiff: 56,
      frontCamber: -2.90, rearCamber: -1.60, frontToe: 0.08, rearToe: 0.35,
      frontSuspension: 6, rearSuspension: 5, frontAntiRollBar: 8, rearAntiRollBar: 6,
      frontRideHeight: 3, rearRideHeight: 4, brakePressure: 95, brakeBias: 55,
      frontLeftTyrePressure: 23.4, frontRightTyrePressure: 23.4, rearLeftTyrePressure: 21.0, rearRightTyrePressure: 21.0
    }
  },
  5: {
    id: 5,
    name: "Circuit de Monaco",
    country: "Monaco",
    downforceTier: "Maximum",
    tyreWear: "Low",
    tractionDemand: "High",
    brakingDemand: "Medium",
    typicalLapTime: "1:12.500",
    baselineSetup: {
      frontWing: 11, rearWing: 11, onThrottleDiff: 50, offThrottleDiff: 50,
      frontCamber: -2.50, rearCamber: -1.00, frontToe: 0.05, rearToe: 0.20,
      frontSuspension: 1, rearSuspension: 2, frontAntiRollBar: 1, rearAntiRollBar: 2,
      frontRideHeight: 6, rearRideHeight: 7, brakePressure: 90, brakeBias: 54,
      frontLeftTyrePressure: 22.2, frontRightTyrePressure: 22.2, rearLeftTyrePressure: 20.3, rearRightTyrePressure: 20.3
    }
  },
  6: {
    id: 6,
    name: "Circuit Gilles Villeneuve (Montreal)",
    country: "Canada",
    downforceTier: "Low",
    tyreWear: "Medium",
    tractionDemand: "High",
    brakingDemand: "Heavy",
    typicalLapTime: "1:13.200",
    baselineSetup: {
      frontWing: 4, rearWing: 4, onThrottleDiff: 65, offThrottleDiff: 55,
      frontCamber: -2.70, rearCamber: -1.50, frontToe: 0.08, rearToe: 0.30,
      frontSuspension: 4, rearSuspension: 3, frontAntiRollBar: 6, rearAntiRollBar: 4,
      frontRideHeight: 4, rearRideHeight: 5, brakePressure: 100, brakeBias: 56,
      frontLeftTyrePressure: 23.0, frontRightTyrePressure: 23.0, rearLeftTyrePressure: 21.0, rearRightTyrePressure: 21.0
    }
  },
  7: {
    id: 7,
    name: "Silverstone Circuit",
    country: "Great Britain",
    downforceTier: "High",
    tyreWear: "Extreme",
    tractionDemand: "Medium",
    brakingDemand: "Medium",
    typicalLapTime: "1:27.400",
    baselineSetup: {
      frontWing: 7, rearWing: 8, onThrottleDiff: 75, offThrottleDiff: 60,
      frontCamber: -3.00, rearCamber: -1.70, frontToe: 0.10, rearToe: 0.38,
      frontSuspension: 7, rearSuspension: 6, frontAntiRollBar: 9, rearAntiRollBar: 7,
      frontRideHeight: 2, rearRideHeight: 3, brakePressure: 95, brakeBias: 55,
      frontLeftTyrePressure: 24.2, frontRightTyrePressure: 24.2, rearLeftTyrePressure: 22.3, rearRightTyrePressure: 22.3
    }
  },
  9: {
    id: 9,
    name: "Hungaroring (Budapest)",
    country: "Hungary",
    downforceTier: "Maximum",
    tyreWear: "High",
    tractionDemand: "High",
    brakingDemand: "Medium",
    typicalLapTime: "1:17.100",
    baselineSetup: {
      frontWing: 10, rearWing: 11, onThrottleDiff: 55, offThrottleDiff: 52,
      frontCamber: -2.90, rearCamber: -1.60, frontToe: 0.08, rearToe: 0.32,
      frontSuspension: 4, rearSuspension: 3, frontAntiRollBar: 5, rearAntiRollBar: 3,
      frontRideHeight: 4, rearRideHeight: 5, brakePressure: 95, brakeBias: 55,
      frontLeftTyrePressure: 22.6, frontRightTyrePressure: 22.6, rearLeftTyrePressure: 20.7, rearRightTyrePressure: 20.7
    }
  },
  10: {
    id: 10,
    name: "Circuit de Spa-Francorchamps",
    country: "Belgium",
    downforceTier: "Low",
    tyreWear: "High",
    tractionDemand: "Medium",
    brakingDemand: "Medium",
    typicalLapTime: "1:44.200",
    baselineSetup: {
      frontWing: 4, rearWing: 4, onThrottleDiff: 72, offThrottleDiff: 58,
      frontCamber: -2.80, rearCamber: -1.60, frontToe: 0.09, rearToe: 0.35,
      frontSuspension: 6, rearSuspension: 5, frontAntiRollBar: 8, rearAntiRollBar: 6,
      frontRideHeight: 3, rearRideHeight: 4, brakePressure: 95, brakeBias: 55,
      frontLeftTyrePressure: 23.4, frontRightTyrePressure: 23.4, rearLeftTyrePressure: 21.4, rearRightTyrePressure: 21.4
    }
  },
  11: {
    id: 11,
    name: "Autodromo Nazionale Monza",
    country: "Italy",
    downforceTier: "Very Low",
    tyreWear: "Medium",
    tractionDemand: "High",
    brakingDemand: "Heavy",
    typicalLapTime: "1:21.000",
    baselineSetup: {
      frontWing: 2, rearWing: 2, onThrottleDiff: 65, offThrottleDiff: 54,
      frontCamber: -2.70, rearCamber: -1.50, frontToe: 0.07, rearToe: 0.30,
      frontSuspension: 3, rearSuspension: 3, frontAntiRollBar: 6, rearAntiRollBar: 4,
      frontRideHeight: 4, rearRideHeight: 5, brakePressure: 100, brakeBias: 57,
      frontLeftTyrePressure: 23.0, frontRightTyrePressure: 23.0, rearLeftTyrePressure: 21.0, rearRightTyrePressure: 21.0
    }
  },
  12: {
    id: 12,
    name: "Marina Bay Street Circuit",
    country: "Singapore",
    downforceTier: "Maximum",
    tyreWear: "High",
    tractionDemand: "High",
    brakingDemand: "Heavy",
    typicalLapTime: "1:38.500",
    baselineSetup: {
      frontWing: 10, rearWing: 11, onThrottleDiff: 55, offThrottleDiff: 52,
      frontCamber: -2.80, rearCamber: -1.50, frontToe: 0.07, rearToe: 0.28,
      frontSuspension: 2, rearSuspension: 3, frontAntiRollBar: 3, rearAntiRollBar: 3,
      frontRideHeight: 5, rearRideHeight: 6, brakePressure: 95, brakeBias: 55,
      frontLeftTyrePressure: 22.2, frontRightTyrePressure: 22.2, rearLeftTyrePressure: 20.3, rearRightTyrePressure: 20.3
    }
  },
  13: {
    id: 13,
    name: "Suzuka International Racing Course",
    country: "Japan",
    downforceTier: "High",
    tyreWear: "Extreme",
    tractionDemand: "Medium",
    brakingDemand: "Medium",
    typicalLapTime: "1:29.800",
    baselineSetup: {
      frontWing: 8, rearWing: 9, onThrottleDiff: 75, offThrottleDiff: 60,
      frontCamber: -3.10, rearCamber: -1.70, frontToe: 0.10, rearToe: 0.38,
      frontSuspension: 7, rearSuspension: 6, frontAntiRollBar: 9, rearAntiRollBar: 7,
      frontRideHeight: 2, rearRideHeight: 3, brakePressure: 95, brakeBias: 55,
      frontLeftTyrePressure: 24.2, frontRightTyrePressure: 24.2, rearLeftTyrePressure: 22.3, rearRightTyrePressure: 22.3
    }
  },
  17: {
    id: 17,
    name: "Red Bull Ring (Spielberg)",
    country: "Austria",
    downforceTier: "Medium",
    tyreWear: "Low",
    tractionDemand: "High",
    brakingDemand: "Heavy",
    typicalLapTime: "1:05.500",
    baselineSetup: {
      frontWing: 5, rearWing: 5, onThrottleDiff: 68, offThrottleDiff: 55,
      frontCamber: -2.80, rearCamber: -1.50, frontToe: 0.08, rearToe: 0.32,
      frontSuspension: 4, rearSuspension: 4, frontAntiRollBar: 7, rearAntiRollBar: 5,
      frontRideHeight: 4, rearRideHeight: 5, brakePressure: 100, brakeBias: 56,
      frontLeftTyrePressure: 23.0, frontRightTyrePressure: 23.0, rearLeftTyrePressure: 21.0, rearRightTyrePressure: 21.0
    }
  },
  20: {
    id: 20,
    name: "Baku City Circuit",
    country: "Azerbaijan",
    downforceTier: "Very Low",
    tyreWear: "Low",
    tractionDemand: "High",
    brakingDemand: "Heavy",
    typicalLapTime: "1:42.500",
    baselineSetup: {
      frontWing: 3, rearWing: 3, onThrottleDiff: 60, offThrottleDiff: 53,
      frontCamber: -2.70, rearCamber: -1.50, frontToe: 0.07, rearToe: 0.28,
      frontSuspension: 3, rearSuspension: 3, frontAntiRollBar: 5, rearAntiRollBar: 4,
      frontRideHeight: 4, rearRideHeight: 5, brakePressure: 98, brakeBias: 56,
      frontLeftTyrePressure: 22.6, frontRightTyrePressure: 22.6, rearLeftTyrePressure: 20.7, rearRightTyrePressure: 20.7
    }
  },
  26: {
    id: 26,
    name: "Circuit Zandvoort",
    country: "Netherlands",
    downforceTier: "Maximum",
    tyreWear: "High",
    tractionDemand: "High",
    brakingDemand: "Medium",
    typicalLapTime: "1:11.800",
    baselineSetup: {
      frontWing: 10, rearWing: 10, onThrottleDiff: 65, offThrottleDiff: 56,
      frontCamber: -3.20, rearCamber: -1.80, frontToe: 0.09, rearToe: 0.35,
      frontSuspension: 6, rearSuspension: 5, frontAntiRollBar: 8, rearAntiRollBar: 6,
      frontRideHeight: 3, rearRideHeight: 4, brakePressure: 95, brakeBias: 55,
      frontLeftTyrePressure: 24.2, frontRightTyrePressure: 24.2, rearLeftTyrePressure: 22.3, rearRightTyrePressure: 22.3
    }
  }
};

export const DEFAULT_TRACK = F1_TRACKS[3]; // Bahrain

export const HANDLING_FEEDBACK_OPTIONS: HandlingFeedbackItem[] = [
  {
    id: "oversteer_exit",
    label: "Oversteer on Corner Exit",
    description: "Rear kicks out when getting on the throttle out of slow/medium corners",
    symptom: "Differential on-throttle too aggressive or rear anti-roll bar too stiff"
  },
  {
    id: "understeer_entry",
    label: "Understeer on Corner Entry",
    description: "Car won't turn in when trail-braking or entering turns",
    symptom: "Front wing insufficient, front brake bias too high, or off-throttle diff too locked"
  },
  {
    id: "understeer_mid",
    label: "Mid-Corner Push / Washout",
    description: "Front end scrubs wide at apex while holding steady speed",
    symptom: "Front anti-roll bar too stiff or lack of front camber / aerodynamic load"
  },
  {
    id: "high_speed_snap",
    label: "High-Speed Instability / Snap",
    description: "Rear feels twitchy or snaps unpredictably in 6th/7th gear corners",
    symptom: "Rear wing too low or rear ride height too high (excessive rake stall)"
  },
  {
    id: "kerb_unstable",
    label: "Kerbs Unsettle the Car",
    description: "Hitting rumble strips launches or destabilizes the chassis",
    symptom: "Suspension springs too stiff or ride height bottoming out"
  },
  {
    id: "front_locking",
    label: "Front Brakes Locking Up",
    description: "Front tyres smoke and screech under initial heavy deceleration",
    symptom: "Front brake bias too far forward or brake pressure too high"
  },
  {
    id: "rear_locking",
    label: "Rear Brakes Locking / Rotation on Entry",
    description: "Car wants to spin around while braking hard in a straight line",
    symptom: "Brake bias too far rearward"
  },
  {
    id: "tyres_overheating",
    label: "Tyres Overheating / Blistering",
    description: "Tyre core temps exceed 108°C causing sudden grip loss after 3 laps",
    symptom: "Tyre pressure too high or sliding across surface"
  },
  {
    id: "lacking_top_speed",
    label: "Lacking Straight-Line Speed",
    description: "Getting overtaken on long straights / cannot reach speed traps",
    symptom: "Wings set too high inducing unnecessary aerodynamic drag"
  }
];

export interface DriverRosterItem {
  id: string;
  name: string;
  number: number;
  team: string;
  teamColor: string;
}

export const F1_OFFICIAL_DRIVERS: DriverRosterItem[] = [
  { id: "hamilton", name: "Lewis Hamilton", number: 44, team: "Mercedes-AMG Petronas", teamColor: "#00D2BE" },
  { id: "bottas", name: "Valtteri Bottas", number: 77, team: "Mercedes-AMG Petronas", teamColor: "#00D2BE" },
  { id: "verstappen", name: "Max Verstappen", number: 33, team: "Red Bull Racing", teamColor: "#0600EF" },
  { id: "albon", name: "Alexander Albon", number: 23, team: "Red Bull Racing", teamColor: "#0600EF" },
  { id: "leclerc", name: "Charles Leclerc", number: 16, team: "Scuderia Ferrari", teamColor: "#DC0000" },
  { id: "vettel", name: "Sebastian Vettel", number: 5, team: "Scuderia Ferrari", teamColor: "#DC0000" },
  { id: "norris", name: "Lando Norris", number: 4, team: "McLaren F1 Team", teamColor: "#FF8700" },
  { id: "sainz", name: "Carlos Sainz", number: 55, team: "McLaren F1 Team", teamColor: "#FF8700" },
  { id: "ricciardo", name: "Daniel Ricciardo", number: 3, team: "Renault DP World", teamColor: "#FFF500" },
  { id: "ocon", name: "Esteban Ocon", number: 31, team: "Renault DP World", teamColor: "#FFF500" },
  { id: "gasly", name: "Pierre Gasly", number: 10, team: "Scuderia AlphaTauri", teamColor: "#FFFFFF" },
  { id: "kvyat", name: "Daniil Kvyat", number: 26, team: "Scuderia AlphaTauri", teamColor: "#FFFFFF" },
  { id: "perez", name: "Sergio Perez", number: 11, team: "Racing Point F1 Team", teamColor: "#F596C8" },
  { id: "stroll", name: "Lance Stroll", number: 18, team: "Racing Point F1 Team", teamColor: "#F596C8" },
  { id: "raikkonen", name: "Kimi Räikkönen", number: 7, team: "Alfa Romeo Racing", teamColor: "#9B0000" },
  { id: "giovinazzi", name: "Antonio Giovinazzi", number: 99, team: "Alfa Romeo Racing", teamColor: "#9B0000" },
  { id: "grosjean", name: "Romain Grosjean", number: 8, team: "Haas F1 Team", teamColor: "#787878" },
  { id: "magnussen", name: "Kevin Magnussen", number: 20, team: "Haas F1 Team", teamColor: "#787878" },
  { id: "russell", name: "George Russell", number: 63, team: "Williams Racing", teamColor: "#0082FA" },
  { id: "latifi", name: "Nicholas Latifi", number: 6, team: "Williams Racing", teamColor: "#0082FA" },
];

