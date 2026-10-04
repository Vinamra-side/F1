"use client";

import { useState } from "react";
import { analyzeTelemetryAndGenerateSetup } from "@/lib/engineer_engine";
import type { TelemetrySnapshot, TyreQuad } from "@/lib/types";

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "--:--.---";
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(3).padStart(6, "0")}`;
}

function InputBar({ label, value, color }: { label: string; value: number; color: string }) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span className="text-neutral-400">{label}</span><span className="font-mono text-white">{percent}%</span></div>
      <div className="h-2 overflow-hidden rounded bg-neutral-800"><div className={`h-full ${color}`} style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function TyreCell({ corner, temperature, surface, wear, pressure, brake }: {
  corner: keyof TyreQuad<number>;
  temperature: number;
  surface: number;
  wear: number;
  pressure: number;
  brake: number;
}) {
  const hot = temperature >= 105 || wear >= 60;
  const brakePercent = Math.max(0, Math.min(100, brake / 10));
  const brakeColor = brake >= 900 ? "bg-red-400" : brake >= 700 ? "bg-amber-400" : "bg-emerald-400";
  const treadColor = wear > 50 ? "bg-red-500" : wear > 30 ? "bg-amber-500" : "bg-emerald-500";
  const cornerName = { fl: "Front left", fr: "Front right", rl: "Rear left", rr: "Rear right" }[corner];
  return (
      <div className="pit-tyre-cell rounded-lg border border-neutral-800 bg-neutral-950/75 p-3">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
        <span>{cornerName} ({corner.toUpperCase()})</span><span className={hot ? "text-amber-400" : "text-cyan-300"}>{Math.round(temperature)}°C core</span>
      </div>
      <div className="pit-tyre-details mt-2 font-mono">
        <div><span>Surface</span><strong>{Math.round(surface)}°C</strong></div>
        <div className="pit-tyre-tread" role="meter" aria-label={`${cornerName} tyre wear`} aria-valuenow={Math.round(wear)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${wear.toFixed(1)} percent worn`}>
          <div className={treadColor} style={{ height: `${Math.max(0, Math.min(100, 100 - wear))}%` }} />
          <strong>{wear.toFixed(1)}%</strong>
        </div>
        <div className="text-right"><span>Pressure</span><strong>{pressure.toFixed(1)} <small>PSI</small></strong></div>
      </div>
      <div className="mt-2 flex justify-between gap-1 text-[11px] text-neutral-400"><span>Brake temp</span><span>{Math.round(brake)}°C</span></div>
      <div className="pit-brake-meter mt-1 h-1.5 overflow-hidden rounded bg-neutral-800" role="meter" aria-label={`${cornerName} brake temperature`} aria-valuenow={Math.round(brake)} aria-valuemin={0} aria-valuemax={1000} aria-valuetext={`${Math.round(brake)} degrees Celsius`}><div className={`h-full ${brakeColor}`} style={{ width: `${brakePercent}%` }} /></div>
    </div>
  );
}

export function PitWallOverview({ snapshot }: { snapshot: TelemetrySnapshot }) {
  const [speaking, setSpeaking] = useState(false);
  const analysis = analyzeTelemetryAndGenerateSetup(snapshot);
  const briefing = analysis.briefing;
  const { telemetry, status, lapData, damage, session } = snapshot;
  const validLaps = snapshot.completedLaps.filter((lap) => lap.isValid && lap.lapTime > 0);
  const bestLap = validLaps.length ? Math.min(...validLaps.map((lap) => lap.lapTime)) : 0;
  const latestLaps = snapshot.completedLaps.slice(-3).reverse();
  const ersPercent = Math.max(0, Math.min(100, Math.round(status.ersStoreEnergy / 40000)));
  const deployMode = status.ersDeployMode === undefined ? "—" : (["None", "Medium", "Hotlap", "Overtake"][status.ersDeployMode] ?? "—");
  const fuelTarget = status.fuelRemainingLaps > 0 ? status.fuelInTank / status.fuelRemainingLaps : null;

  const playRadio = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(analysis.radioMessage);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="pit-wall-grid font-mono">
      <section className="pit-panel pit-wall-timing" aria-label="Live timing">
        <div className="pit-metric"><span>Driver / position</span><strong>{snapshot.driverName} <em>P{lapData.carPosition}</em></strong></div>
        <div className="pit-metric"><span>Lap</span><strong>{lapData.currentLapNum}<em>{session.totalLaps ? ` / ${session.totalLaps}` : ""}</em></strong></div>
        <div className="pit-metric"><span>Current time</span><strong className={lapData.isCurrentLapInvalid ? "text-red-400" : "text-white"}>{formatTime(lapData.currentLapTime)}</strong></div>
        <div className="pit-metric"><span>Best valid lap</span><strong>{formatTime(bestLap)}</strong></div>
        <div className="pit-metric"><span>Session / track</span><strong className="truncate text-sm">{session.sessionType} · {session.trackName}</strong></div>
        <div className="pit-metric"><span>Weather / track</span><strong>{session.weather} <em>{session.trackTemperature}°C</em></strong></div>
      </section>

      <section className="pit-panel pit-wall-strategy" aria-label="Engineer strategy">
        <div className="pit-panel-heading"><h2>Engineer call</h2><span>{briefing.sessionLabel}</span></div>
        <p className="pit-call">{briefing.headline}</p>
        <p className="pit-rationale">{briefing.rationale}</p>
        <div className="pit-radio-inline">
          <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">Pit wall radio</span><button type="button" onClick={playRadio} aria-pressed={speaking} className="pit-button">{speaking ? "Mute" : "Play voice"}</button></div>
          <p>{analysis.radioMessage}</p>
        </div>
        <dl className="pit-call-list">
          <div><dt>{briefing.pitLabel}</dt><dd>{briefing.pitCall}</dd></div>
          <div><dt>Next compound</dt><dd>{briefing.tyreCall}</dd></div>
          <div><dt>Fuel mix</dt><dd>{briefing.fuelCall}</dd></div>
        </dl>
      </section>

      <section className="pit-panel pit-wall-car" aria-label="Live car telemetry">
        <div className="pit-panel-heading"><h2>Car telemetry</h2><span className={`pit-drs-badge ${telemetry.drs ? "pit-drs-active" : status.drsAllowed ? "pit-drs-ready" : ""}`}>DRS {telemetry.drs ? "active" : status.drsAllowed ? "ready" : "off"}</span></div>
        <div className="pit-car-primary"><div><span>Speed</span><strong>{telemetry.speed}</strong><small>km/h</small></div><div><span>Gear</span><strong>{telemetry.gear === 0 ? "N" : telemetry.gear === -1 ? "R" : telemetry.gear}</strong><small>{telemetry.engineRPM.toLocaleString()} rpm</small></div></div>
        <div className="pit-inputs"><InputBar label="Throttle" value={telemetry.throttle} color="bg-emerald-400" /><InputBar label="Brake" value={telemetry.brake} color="bg-red-400" /></div>
        <div className="pit-energy-grid">
          <div className="pit-energy-card" role="meter" aria-label="ERS battery" aria-valuenow={ersPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="pit-energy-heading"><span>ERS battery</span><strong>{ersPercent}%</strong></div>
            <div className="pit-energy-track"><div className="bg-amber-400" style={{ width: `${ersPercent}%` }} /></div>
            <small>Deploy mode · {deployMode}</small>
          </div>
          <div className="pit-energy-card">
            <div className="pit-energy-heading"><span>Fuel range</span><strong>{status.fuelRemainingLaps.toFixed(1)} laps</strong></div>
            <div className="pit-fuel-amount">{status.fuelInTank.toFixed(1)} <small>kg</small></div>
            <small>Lap target · {fuelTarget === null ? "—" : `~${fuelTarget.toFixed(2)} kg/lap`}</small>
          </div>
        </div>
        <dl className="pit-car-secondary"><div><dt>Compound</dt><dd>{status.tyreCompound}</dd></div><div><dt>Lateral G</dt><dd>{snapshot.motion.gForceLateral.toFixed(1)} G</dd></div><div><dt>Steering</dt><dd>{Math.round(telemetry.steer * 100)}%</dd></div></dl>
      </section>

      <section className="pit-panel pit-wall-tyres" aria-label="Tyres and brakes">
        <div className="pit-panel-heading"><h2>Tyres & brakes</h2><span>Core · wear · pressure</span></div>
        <div className="pit-tyre-grid">{(["fl", "fr", "rl", "rr"] as const).map((corner) => <TyreCell key={corner} corner={corner} temperature={telemetry.tyresInnerTemperature[corner]} surface={telemetry.tyresSurfaceTemperature[corner]} wear={damage.tyresWear[corner]} pressure={telemetry.tyresPressure[corner]} brake={telemetry.brakesTemperature[corner]} />)}</div>
      </section>

      <section className="pit-panel pit-wall-laps" aria-label="Recent laps">
        <div className="pit-panel-heading"><h2>Recent laps</h2><span>{snapshot.completedLaps.length} logged</span></div>
        {latestLaps.length ? <ol>{latestLaps.map((lap) => <li key={lap.lapNumber}><span>L{lap.lapNumber}{lap.isValid ? "" : " · invalid"}</span><strong>{lap.lapTimeFormatted}</strong></li>)}</ol> : <p>First completed lap will appear here.</p>}
      </section>
    </div>
  );
}
