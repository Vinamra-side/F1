"use client";

import React, { useState } from "react";
import {
  TelemetrySnapshot,
  HandlingFeedbackId,
  SetupParameters,
} from "@/lib/types";
import { HANDLING_FEEDBACK_OPTIONS } from "@/lib/f1_constants";
import { analyzeTelemetryAndGenerateSetup } from "@/lib/engineer_engine";
import {
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Volume2,
  Wrench,
  ShieldAlert,
} from "lucide-react";

interface RaceEngineerProps {
  snapshot: TelemetrySnapshot;
  onApplySetup?: (newSetup: SetupParameters) => void;
}

export function RaceEngineer({ snapshot, onApplySetup }: RaceEngineerProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<HandlingFeedbackId[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState<"recommendations" | "full_sheet">("recommendations");

  const analysis = analyzeTelemetryAndGenerateSetup(snapshot, selectedFeedback);
  const driverName = snapshot.driverName || "Driver";

  const toggleFeedback = (id: HandlingFeedbackId) => {
    setSelectedFeedback((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSpeakRadio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(analysis.radioMessage);
    utterance.rate = 1.05;
    utterance.pitch = 0.95; // Slightly lower race engineer radio tone
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const copySetupToClipboard = () => {
    const s = analysis.targetSetup;
    const text = `
=== F1 2020 CAR SETUP (${snapshot.session.trackName}) ===
Driver: ${driverName}
[AERODYNAMICS]
Front Wing Aero: ${s.frontWing}
Rear Wing Aero: ${s.rearWing}

[TRANSMISSION]
Differential On-Throttle: ${s.onThrottleDiff}%
Differential Off-Throttle: ${s.offThrottleDiff}%

[SUSPENSION GEOMETRY]
Front Camber: ${s.frontCamber}°
Rear Camber: ${s.rearCamber}°
Front Toe: ${s.frontToe}°
Rear Toe: ${s.rearToe}°

[SUSPENSION]
Front Suspension: ${s.frontSuspension}
Rear Suspension: ${s.rearSuspension}
Front Anti-Roll Bar: ${s.frontAntiRollBar}
Rear Anti-Roll Bar: ${s.rearAntiRollBar}
Front Ride Height: ${s.frontRideHeight}
Rear Ride Height: ${s.rearRideHeight}

[BRAKES]
Brake Pressure: ${s.brakePressure}%
Front Brake Bias: ${s.brakeBias}%

[TYRE PRESSURES]
Front Left / Right: ${s.frontLeftTyrePressure} PSI
Rear Left / Right: ${s.rearLeftTyrePressure} PSI
======================================================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setup = analysis.targetSetup;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-2xl space-y-6">
      {/* Race Engineer Radio Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-neutral-950 to-neutral-950 border border-cyan-800/40 rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-cyan-800/20 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4" /> Pit Wall Radio Transmission
            </span>
          </div>

          <button
            onClick={handleSpeakRadio}
            className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
              isSpeaking
                ? "bg-red-500/20 text-red-400 border border-red-500/50"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            {isSpeaking ? "Mute Radio" : "Play Voice Radio"}
          </button>
        </div>

        <p className="font-mono text-sm text-neutral-200 leading-relaxed italic">
          &ldquo;{analysis.radioMessage}&rdquo;
        </p>
      </div>

      {/* Car Balance Spectrum Gauge */}
      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-400">CHASSIS BALANCE TELEMETRY:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded ${
              analysis.balanceScore < -2
                ? "bg-red-950/80 text-red-400 border border-red-800"
                : analysis.balanceScore > 2
                ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                : "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
            }`}
          >
            {analysis.balanceLabel} (Score: {analysis.balanceScore > 0 ? `+${analysis.balanceScore}` : analysis.balanceScore})
          </span>
        </div>

        {/* Visual Balance Slider */}
        <div className="relative pt-1 pb-4">
          <div className="flex justify-between text-[10px] font-mono text-neutral-500 mb-1">
            <span className="text-red-400 font-bold">OVERSTEER (-10)</span>
            <span className="text-emerald-400 font-bold">BALANCED (0)</span>
            <span className="text-amber-400 font-bold">UNDERSTEER (+10)</span>
          </div>

          <div className="h-3 w-full bg-neutral-800 rounded-full relative overflow-hidden flex items-center">
            {/* Center zero line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-neutral-500 z-10" />
            {/* Balance Bar */}
            <div
              className={`h-full transition-all duration-300 ${
                analysis.balanceScore < 0 ? "bg-red-500" : "bg-amber-500"
              }`}
              style={{
                left: analysis.balanceScore < 0 ? `${50 + analysis.balanceScore * 5}%` : "50%",
                width: `${Math.abs(analysis.balanceScore) * 5}%`,
                position: "absolute",
              }}
            />
          </div>
        </div>

        {/* Diagnosed Telemetry Findings */}
        {analysis.diagnosedIssues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80">
            {analysis.diagnosedIssues.map((issue, i) => (
              <div
                key={i}
                className="text-xs font-mono p-2.5 rounded bg-neutral-900 border border-neutral-800 flex items-start gap-2"
              >
                <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${issue.severity === "danger" ? "text-red-400" : issue.severity === "warning" ? "text-amber-400" : "text-cyan-400"}`} />
                <div>
                  <span className="font-bold text-neutral-200 block">{issue.title}</span>
                  <span className="text-neutral-400 text-[11px]">{issue.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Driver Handling Feedback Questionnaire */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-xs uppercase font-bold text-neutral-300 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" /> Driver Handling Feedback
          </h4>
          <span className="text-[11px] font-mono text-neutral-500">
            Select what you feel to fine-tune setup clicks
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HANDLING_FEEDBACK_OPTIONS.map((item) => {
            const isSelected = selectedFeedback.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleFeedback(item.id)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "bg-cyan-950/60 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
                }`}
              >
                <div className="font-mono text-xs font-bold">{item.label}</div>
                <div className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                  {item.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Setup Tab Switcher: Recommendations vs Full Garage Sheet */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`px-4 py-1.5 rounded-md font-mono text-xs font-bold transition-colors ${
              activeTab === "recommendations"
                ? "bg-cyan-500 text-black"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            Recommended Setup Adjustments ({analysis.recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab("full_sheet")}
            className={`px-4 py-1.5 rounded-md font-mono text-xs font-bold transition-colors ${
              activeTab === "full_sheet"
                ? "bg-cyan-500 text-black"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            Complete F1 2020 Garage Setup Sheet
          </button>
        </div>

        <button
          onClick={copySetupToClipboard}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md font-mono text-xs flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied to Clipboard!" : "Copy Full Setup"}
        </button>
      </div>

      {/* VIEW 1: Recommended Adjustments */}
      {activeTab === "recommendations" && (
        <div className="space-y-3">
          {analysis.recommendations.length === 0 ? (
            <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-mono text-sm font-bold text-white">Car Setup is Currently Optimal</div>
              <p className="text-xs font-mono text-neutral-400 max-w-md mx-auto">
                Telemetry shows balanced tyre degradation, stable cornering Gs, and zero excessive wheel slip for {snapshot.session.trackName}.
              </p>
            </div>
          ) : (
            analysis.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-800 text-neutral-400">
                      {rec.category}
                    </span>
                    <span className="font-mono text-sm font-bold text-white">{rec.label}</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-sm">
                    <span className="text-neutral-400">
                      Current: <span className="text-white font-bold">{rec.currentValue}</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-bold">
                      Recommended: {rec.recommendedValue} {rec.unit}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        rec.delta > 0
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-red-950 text-red-400 border border-red-800"
                      }`}
                    >
                      {rec.delta > 0 ? `+${rec.delta}` : rec.delta}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-mono text-neutral-300 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/60">
                  <span className="text-cyan-400 font-semibold">Race Engineer Rationale: </span>
                  {rec.reason}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: Complete F1 2020 Garage Setup Sheet */}
      {activeTab === "full_sheet" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {/* Aerodynamics */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
            <h5 className="font-bold text-cyan-400 uppercase border-b border-neutral-800 pb-1.5 flex items-center justify-between">
              <span>1. Aerodynamics</span>
              <span className="text-[10px] text-neutral-500">1 - 11</span>
            </h5>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Front Wing Aero:</span>
              <span className="text-white font-bold text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                {setup.frontWing}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Rear Wing Aero:</span>
              <span className="text-white font-bold text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                {setup.rearWing}
              </span>
            </div>
          </div>

          {/* Transmission */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
            <h5 className="font-bold text-cyan-400 uppercase border-b border-neutral-800 pb-1.5 flex items-center justify-between">
              <span>2. Transmission</span>
              <span className="text-[10px] text-neutral-500">50% - 100%</span>
            </h5>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Diff On-Throttle:</span>
              <span className="text-white font-bold text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                {setup.onThrottleDiff}%
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Diff Off-Throttle:</span>
              <span className="text-white font-bold text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                {setup.offThrottleDiff}%
              </span>
            </div>
          </div>

          {/* Suspension Geometry */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <h5 className="font-bold text-cyan-400 uppercase border-b border-neutral-800 pb-1.5">
              3. Suspension Geometry
            </h5>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-neutral-400">Front Camber:</span>
              <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {setup.frontCamber}°
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-neutral-400">Rear Camber:</span>
              <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {setup.rearCamber}°
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-neutral-400">Front Toe-out:</span>
              <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {setup.frontToe}°
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-neutral-400">Rear Toe-in:</span>
              <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {setup.rearToe}°
              </span>
            </div>
          </div>

          {/* Suspension Springs & ARBs */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <h5 className="font-bold text-cyan-400 uppercase border-b border-neutral-800 pb-1.5">
              4. Suspension
            </h5>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-neutral-400">Front Suspension:</span>
              <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {setup.frontSuspension}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-neutral-400">Rear Suspension:</span>
              <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {setup.rearSuspension}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-neutral-400">Front Anti-Roll Bar:</span>
              <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {setup.frontAntiRollBar}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-neutral-400">Rear Anti-Roll Bar:</span>
              <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {setup.rearAntiRollBar}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-neutral-400">Front Ride Height:</span>
              <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {setup.frontRideHeight}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-neutral-400">Rear Ride Height:</span>
              <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {setup.rearRideHeight}
              </span>
            </div>
          </div>

          {/* Brakes */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
            <h5 className="font-bold text-cyan-400 uppercase border-b border-neutral-800 pb-1.5">
              5. Brakes
            </h5>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Brake Pressure:</span>
              <span className="text-white font-bold text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                {setup.brakePressure}%
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Front Brake Bias:</span>
              <span className="text-white font-bold text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                {setup.brakeBias}%
              </span>
            </div>
          </div>

          {/* Tyres */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
            <h5 className="font-bold text-cyan-400 uppercase border-b border-neutral-800 pb-1.5">
              6. Tyre Pressures
            </h5>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Front Tyres (FL / FR):</span>
              <span className="text-white font-bold text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                {setup.frontLeftTyrePressure} PSI
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Rear Tyres (RL / RR):</span>
              <span className="text-white font-bold text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                {setup.rearLeftTyrePressure} PSI
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
