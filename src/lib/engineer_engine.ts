import {
  SetupParameters,
  SetupRecommendation,
  TelemetrySnapshot,
  HandlingFeedbackId,
} from "./types";
import { buildSessionBriefing, SessionBriefing } from "./strategy";

export interface EngineerAnalysis {
  radioMessage: string;
  briefing: SessionBriefing;
  balanceScore: number; // -10 (Oversteer) to +10 (Understeer), 0 = Neutral
  balanceLabel: string;
  recommendations: SetupRecommendation[];
  diagnosedIssues: {
    title: string;
    description: string;
    severity: "warning" | "danger" | "info";
  }[];
  targetSetup: SetupParameters;
}

export function analyzeTelemetryAndGenerateSetup(
  snapshot: TelemetrySnapshot,
  activeFeedback: HandlingFeedbackId[] = []
): EngineerAnalysis {
  const currentSetup = { ...snapshot.setup };
  const targetSetup: SetupParameters = { ...currentSetup };
  const recommendations: SetupRecommendation[] = [];
  const diagnosedIssues: { title: string; description: string; severity: "warning" | "danger" | "info" }[] = [];

  // Telemetry metrics
  const innerTemps = snapshot.telemetry.tyresInnerTemperature || { fl: 100, fr: 100, rl: 100, rr: 100 };
  const frontInnerAvg = (innerTemps.fl + innerTemps.fr) / 2;
  const rearInnerAvg = (innerTemps.rl + innerTemps.rr) / 2;
  const oversteerCount = snapshot.diagnostics?.oversteerEvents || 0;
  const understeerCount = snapshot.diagnostics?.understeerEvents || 0;
  const frontLockCount = snapshot.diagnostics?.frontLockingEvents || 0;
  const kerbHits = snapshot.diagnostics?.kerbBottomingEvents || 0;

  let balanceScore = 0; // Negative = Oversteer, Positive = Understeer

  // 1. Analyze Oversteer vs Understeer balance
  if (oversteerCount > understeerCount + 2 || activeFeedback.includes("oversteer_exit")) {
    balanceScore -= 4;
  }
  if (understeerCount > oversteerCount + 2 || activeFeedback.includes("understeer_entry") || activeFeedback.includes("understeer_mid")) {
    balanceScore += 4;
  }
  if (frontInnerAvg > rearInnerAvg + 7) {
    balanceScore += 2; // Front tyres overheating = scrubbing/understeering
  }
  if (rearInnerAvg > frontInnerAvg + 7) {
    balanceScore -= 2; // Rear tyres overheating = spinning/oversteering
  }

  // ----------------------------------------------------------------------
  // DIAGNOSTIC 1: Corner Entry Understeer / Turn-in Bite
  // ----------------------------------------------------------------------
  if (activeFeedback.includes("understeer_entry") || balanceScore >= 3) {
    diagnosedIssues.push({
      title: "Corner Entry Understeer Detected",
      description: "Car lacks front-axle bite into turn-in; front tyres scrubbing and running high core temperature.",
      severity: "warning",
    });

    // A) Increase front wing aero
    if (targetSetup.frontWing < 11) {
      const oldVal = targetSetup.frontWing;
      targetSetup.frontWing = Math.min(11, targetSetup.frontWing + 1);
      recommendations.push({
        category: "Aerodynamics",
        parameter: "frontWing",
        label: "Front Wing Aero",
        currentValue: oldVal,
        recommendedValue: targetSetup.frontWing,
        delta: targetSetup.frontWing - oldVal,
        unit: "clicks",
        reason: "Increases front downforce to pin front axle on entry into high & medium speed corners.",
        priority: "High",
      });
    }

    // B) Soften front Anti-Roll Bar
    if (targetSetup.frontAntiRollBar > 3) {
      const oldVal = targetSetup.frontAntiRollBar;
      targetSetup.frontAntiRollBar = Math.max(2, targetSetup.frontAntiRollBar - 1);
      recommendations.push({
        category: "Suspension",
        parameter: "frontAntiRollBar",
        label: "Front Anti-Roll Bar",
        currentValue: oldVal,
        recommendedValue: targetSetup.frontAntiRollBar,
        delta: targetSetup.frontAntiRollBar - oldVal,
        unit: "clicks",
        reason: "Softening front ARB increases front mechanical grip and reduces understeer mid-corner.",
        priority: "Medium",
      });
    }

    // C) Open Off-Throttle Differential
    if (targetSetup.offThrottleDiff > 52) {
      const oldVal = targetSetup.offThrottleDiff;
      targetSetup.offThrottleDiff = Math.max(50, targetSetup.offThrottleDiff - 3);
      recommendations.push({
        category: "Transmission",
        parameter: "offThrottleDiff",
        label: "Off-Throttle Differential",
        currentValue: oldVal,
        recommendedValue: targetSetup.offThrottleDiff,
        delta: targetSetup.offThrottleDiff - oldVal,
        unit: "%",
        reason: "Lower off-throttle diff allows wheels to rotate freely under braking, promoting turn-in rotation.",
        priority: "Medium",
      });
    }
  }

  // ----------------------------------------------------------------------
  // DIAGNOSTIC 2: Corner Exit Oversteer / Traction Snap
  // ----------------------------------------------------------------------
  if (activeFeedback.includes("oversteer_exit") || balanceScore <= -3) {
    diagnosedIssues.push({
      title: "Traction Loss & Exit Oversteer",
      description: "Rear axle breakaways detected on throttle pickup. Rear tyres slipping under torque.",
      severity: "danger",
    });

    // A) Lower On-Throttle Differential
    if (targetSetup.onThrottleDiff > 55) {
      const oldVal = targetSetup.onThrottleDiff;
      targetSetup.onThrottleDiff = Math.max(50, targetSetup.onThrottleDiff - 5);
      recommendations.push({
        category: "Transmission",
        parameter: "onThrottleDiff",
        label: "On-Throttle Differential",
        currentValue: oldVal,
        recommendedValue: targetSetup.onThrottleDiff,
        delta: targetSetup.onThrottleDiff - oldVal,
        unit: "%",
        reason: "Unlocking the on-throttle diff prevents the inside wheel from forcing the rear axle to break loose.",
        priority: "High",
      });
    }

    // B) Soften Rear Anti-Roll Bar
    if (targetSetup.rearAntiRollBar > 3) {
      const oldVal = targetSetup.rearAntiRollBar;
      targetSetup.rearAntiRollBar = Math.max(2, targetSetup.rearAntiRollBar - 1);
      recommendations.push({
        category: "Suspension",
        parameter: "rearAntiRollBar",
        label: "Rear Anti-Roll Bar",
        currentValue: oldVal,
        recommendedValue: targetSetup.rearAntiRollBar,
        delta: targetSetup.rearAntiRollBar - oldVal,
        unit: "clicks",
        reason: "Allows rear tyres to squat and generate lateral traction on corner exit.",
        priority: "High",
      });
    }

    // C) Lower Rear Tyre Pressures
    if (targetSetup.rearLeftTyrePressure > 19.9) {
      const oldVal = targetSetup.rearLeftTyrePressure;
      targetSetup.rearLeftTyrePressure = Math.max(19.5, Number((targetSetup.rearLeftTyrePressure - 0.4).toFixed(1)));
      targetSetup.rearRightTyrePressure = targetSetup.rearLeftTyrePressure;
      recommendations.push({
        category: "Tyres",
        parameter: "rearLeftTyrePressure",
        label: "Rear Tyre Pressures",
        currentValue: oldVal,
        recommendedValue: targetSetup.rearLeftTyrePressure,
        delta: Number((targetSetup.rearLeftTyrePressure - oldVal).toFixed(1)),
        unit: "PSI",
        reason: "Expands the rear tyre contact patch, maximizing traction out of slow corners.",
        priority: "Medium",
      });
    }
  }

  // ----------------------------------------------------------------------
  // DIAGNOSTIC 3: High-Speed Instability
  // ----------------------------------------------------------------------
  if (activeFeedback.includes("high_speed_snap")) {
    diagnosedIssues.push({
      title: "Aerodynamic & High-Speed Instability",
      description: "Rear aerodynamic load unstable at high speeds. Snap oversteer risk in rapid transitions.",
      severity: "danger",
    });

    if (targetSetup.rearWing < 11) {
      const oldVal = targetSetup.rearWing;
      targetSetup.rearWing = Math.min(11, targetSetup.rearWing + 1);
      recommendations.push({
        category: "Aerodynamics",
        parameter: "rearWing",
        label: "Rear Wing Aero",
        currentValue: oldVal,
        recommendedValue: targetSetup.rearWing,
        delta: targetSetup.rearWing - oldVal,
        unit: "clicks",
        reason: "Bolsters rear downforce to firmly plant the rear diffuser in high-speed sweeps.",
        priority: "High",
      });
    }

    // Increase rear toe-in
    if (targetSetup.rearToe < 0.45) {
      const oldVal = targetSetup.rearToe;
      targetSetup.rearToe = Math.min(0.50, Number((targetSetup.rearToe + 0.04).toFixed(2)));
      recommendations.push({
        category: "Suspension Geometry",
        parameter: "rearToe",
        label: "Rear Toe-in",
        currentValue: oldVal,
        recommendedValue: targetSetup.rearToe,
        delta: Number((targetSetup.rearToe - oldVal).toFixed(2)),
        unit: "deg",
        reason: "Adds straight-line and high-speed directional stability to rear axle.",
        priority: "Low",
      });
    }
  }

  // ----------------------------------------------------------------------
  // DIAGNOSTIC 4: Kerb Striking & Suspension Bottoming
  // ----------------------------------------------------------------------
  if (activeFeedback.includes("kerb_unstable") || kerbHits > 3) {
    diagnosedIssues.push({
      title: "Chassis Bottoming on Kerbs",
      description: "Suspension too stiff or ride height too low; bottoming out over curbs unsettled the car.",
      severity: "warning",
    });

    if (targetSetup.frontSuspension > 3) {
      const oldVal = targetSetup.frontSuspension;
      targetSetup.frontSuspension = Math.max(2, targetSetup.frontSuspension - 1);
      recommendations.push({
        category: "Suspension",
        parameter: "frontSuspension",
        label: "Front Suspension Springs",
        currentValue: oldVal,
        recommendedValue: targetSetup.frontSuspension,
        delta: targetSetup.frontSuspension - oldVal,
        unit: "clicks",
        reason: "Softens compliance so car absorbs rumble strips instead of skipping into the air.",
        priority: "Medium",
      });
    }

    if (targetSetup.frontRideHeight < 5) {
      const oldVal = targetSetup.frontRideHeight;
      targetSetup.frontRideHeight = Math.min(6, targetSetup.frontRideHeight + 1);
      targetSetup.rearRideHeight = Math.min(7, targetSetup.rearRideHeight + 1);
      recommendations.push({
        category: "Suspension",
        parameter: "frontRideHeight",
        label: "Ride Height (Front & Rear)",
        currentValue: oldVal,
        recommendedValue: targetSetup.frontRideHeight,
        delta: 1,
        unit: "clicks",
        reason: "Provides underfloor clearance to prevent floor damage and aerodynamic stalling over kerbs.",
        priority: "Medium",
      });
    }
  }

  // ----------------------------------------------------------------------
  // DIAGNOSTIC 5: Brake Locking & Thermal Distribution
  // ----------------------------------------------------------------------
  if (activeFeedback.includes("front_locking") || frontLockCount > 2) {
    diagnosedIssues.push({
      title: "Front Brake Lockup Tendency",
      description: "Excessive front braking torque causing front wheels to lock into heavy braking zones.",
      severity: "warning",
    });

    if (targetSetup.brakeBias > 53) {
      const oldVal = targetSetup.brakeBias;
      targetSetup.brakeBias = Math.max(50, targetSetup.brakeBias - 1);
      recommendations.push({
        category: "Brakes",
        parameter: "brakeBias",
        label: "Front Brake Bias",
        currentValue: oldVal,
        recommendedValue: targetSetup.brakeBias,
        delta: targetSetup.brakeBias - oldVal,
        unit: "%",
        reason: "Moves braking balance rearward, freeing front tyres from locking up and preventing flat spots.",
        priority: "High",
      });
    }
  }

  if (activeFeedback.includes("rear_locking")) {
    diagnosedIssues.push({
      title: "Rear Axle Snapping Under Braking",
      description: "Rear tyres locking up under deceleration, causing sudden yaw rotation.",
      severity: "danger",
    });

    if (targetSetup.brakeBias < 60) {
      const oldVal = targetSetup.brakeBias;
      targetSetup.brakeBias = Math.min(62, targetSetup.brakeBias + 2);
      recommendations.push({
        category: "Brakes",
        parameter: "brakeBias",
        label: "Front Brake Bias",
        currentValue: oldVal,
        recommendedValue: targetSetup.brakeBias,
        delta: targetSetup.brakeBias - oldVal,
        unit: "%",
        reason: "Shifts bias forward to prevent dangerous rear brake lockup spins.",
        priority: "High",
      });
    }
  }

  // ----------------------------------------------------------------------
  // DIAGNOSTIC 6: Tyre Thermal Overheating (>104°C)
  // ----------------------------------------------------------------------
  if (activeFeedback.includes("tyres_overheating") || frontInnerAvg > 105 || rearInnerAvg > 105) {
    diagnosedIssues.push({
      title: "Tyre Thermal Degradation / Overheating",
      description: `Core temperatures reaching ${Math.round(Math.max(frontInnerAvg, rearInnerAvg))}°C, outside optimal 95-102°C operating window.`,
      severity: "warning",
    });

    // Reduce tyre pressures to cool tyres
    if (targetSetup.frontLeftTyrePressure > 21.8) {
      const oldVal = targetSetup.frontLeftTyrePressure;
      targetSetup.frontLeftTyrePressure = Math.max(21.0, Number((targetSetup.frontLeftTyrePressure - 0.4).toFixed(1)));
      targetSetup.frontRightTyrePressure = targetSetup.frontLeftTyrePressure;
      recommendations.push({
        category: "Tyres",
        parameter: "frontLeftTyrePressure",
        label: "Front Tyre Pressures",
        currentValue: oldVal,
        recommendedValue: targetSetup.frontLeftTyrePressure,
        delta: Number((targetSetup.frontLeftTyrePressure - oldVal).toFixed(1)),
        unit: "PSI",
        reason: "Lowers internal thermal pressure buildup and widens footprint to dissipate heat.",
        priority: "High",
      });
    }
  }

  // ----------------------------------------------------------------------
  // DIAGNOSTIC 7: Straight Line Speed Deficit
  // ----------------------------------------------------------------------
  if (activeFeedback.includes("lacking_top_speed")) {
    diagnosedIssues.push({
      title: "Excessive Aerodynamic Drag",
      description: "Downforce trim is heavily penalizing top speed traps on primary straights.",
      severity: "info",
    });

    if (targetSetup.rearWing > 2) {
      const oldVal = targetSetup.rearWing;
      targetSetup.rearWing = Math.max(1, targetSetup.rearWing - 1);
      recommendations.push({
        category: "Aerodynamics",
        parameter: "rearWing",
        label: "Rear Wing Aero",
        currentValue: oldVal,
        recommendedValue: targetSetup.rearWing,
        delta: targetSetup.rearWing - oldVal,
        unit: "clicks",
        reason: "Trims drag on straights for higher terminal top speed and overtaking capability.",
        priority: "Medium",
      });
    }
  }

  // Balance Label
  let balanceLabel = "Balanced / Neutral";
  if (balanceScore <= -5) balanceLabel = "Heavy Oversteer";
  else if (balanceScore <= -2) balanceLabel = "Mild Oversteer";
  else if (balanceScore >= 5) balanceLabel = "Heavy Understeer";
  else if (balanceScore >= 2) balanceLabel = "Mild Understeer";

  const briefing = buildSessionBriefing(snapshot, balanceLabel, recommendations[0]);

  return {
    radioMessage: briefing.radioMessage,
    briefing,
    balanceScore: Math.max(-10, Math.min(10, balanceScore)),
    balanceLabel,
    recommendations,
    diagnosedIssues,
    targetSetup,
  };
}
