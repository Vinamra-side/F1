"use client";

import React from "react";
import { LapRecord } from "@/lib/types";
import { Timer, Zap, Gauge, Award, TrendingUp } from "lucide-react";

interface LapHistoryProps {
  completedLaps: LapRecord[];
  currentLapNum: number;
  currentLapTime: number;
}

export function LapHistory({ completedLaps, currentLapNum, currentLapTime }: LapHistoryProps) {
  // Find best lap time
  const validLaps = completedLaps.filter((l) => l.isValid && l.lapTime > 0);
  const bestLap = validLaps.length > 0
    ? validLaps.reduce((prev, curr) => (curr.lapTime < prev.lapTime ? curr : prev))
    : null;

  // Best sectors overall
  const bestS1 = validLaps.map((l) => l.sector1).filter((s): s is number => s !== null && s > 0);
  const minS1 = bestS1.length > 0 ? Math.min(...bestS1) : null;

  const bestS2 = validLaps.map((l) => l.sector2).filter((s): s is number => s !== null && s > 0);
  const minS2 = bestS2.length > 0 ? Math.min(...bestS2) : null;

  const bestS3 = validLaps.map((l) => l.sector3).filter((s): s is number => s !== null && s > 0);
  const minS3 = bestS3.length > 0 ? Math.min(...bestS3) : null;

  // Average lap time
  const avgTime = validLaps.length > 0
    ? validLaps.reduce((acc, curr) => acc + curr.lapTime, 0) / validLaps.length
    : 0;

  // Average fuel consumption
  const avgFuel = validLaps.length > 0
    ? validLaps.reduce((acc, curr) => acc + curr.fuelUsedKg, 0) / validLaps.length
    : 0;

  // Average tyre wear per lap (front left is usually hardest worked)
  const avgWearFl = validLaps.length > 0
    ? validLaps.reduce((acc, curr) => acc + (curr.tyreWearDelta?.fl || 3.5), 0) / validLaps.length
    : 3.8;

  const formatDelta = (lapTime: number) => {
    if (!bestLap) return "-";
    const delta = lapTime - bestLap.lapTime;
    if (Math.abs(delta) < 0.001) return <span className="text-purple-400 font-bold">BEST</span>;
    return <span className="text-neutral-400">+{delta.toFixed(3)}s</span>;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-2xl space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
            <Timer className="w-5 h-5 text-cyan-400" /> Lap-to-Lap Performance & Telemetry
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time timing, sector splits, tyre wear rate, and fuel burn per lap
          </p>
        </div>

        {/* Live Lap Indicator */}
        <div className="bg-neutral-950 px-4 py-2 rounded-lg border border-neutral-800 font-mono text-sm flex items-center gap-3">
          <span className="text-neutral-400">Current Lap:</span>
          <span className="text-cyan-400 font-bold font-mono">Lap {currentLapNum}</span>
          <span className="text-neutral-600">|</span>
          <span className="text-white font-mono">{currentLapTime.toFixed(3)}s</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Best Lap */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono mb-1">
            <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-purple-400" /> Best Lap</span>
            <span className="text-purple-400 font-bold">{bestLap ? `Lap ${bestLap.lapNumber}` : "-"}</span>
          </div>
          <div className="text-2xl font-mono font-bold text-purple-400">
            {bestLap ? bestLap.lapTimeFormatted : "--:--.---"}
          </div>
        </div>

        {/* Average Pace */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono mb-1">
            <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Average Pace</span>
            <span className="text-neutral-400">{validLaps.length} Laps</span>
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {avgTime > 0 ? `${Math.floor(avgTime / 60)}:${(avgTime % 60).toFixed(3).padStart(6, "0")}` : "--:--.---"}
          </div>
        </div>

        {/* Fuel Burn Rate */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono mb-1">
            <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-emerald-400" /> Fuel Burn Rate</span>
            <span className="text-emerald-400">Target 1.8</span>
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {avgFuel > 0 ? `${avgFuel.toFixed(2)}` : "1.82"} <span className="text-xs text-neutral-500 font-normal">KG/LAP</span>
          </div>
        </div>

        {/* Stint Wear Projection */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono mb-1">
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Tyre Wear Rate</span>
            <span className="text-amber-400">FL Deg</span>
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            ~{avgWearFl.toFixed(1)}% <span className="text-xs text-neutral-500 font-normal">/ lap</span>
          </div>
          <div className="text-[10px] font-mono text-neutral-400 mt-1">
            Pit Window: L{Math.round(55 / (avgWearFl || 4))} - L{Math.round(70 / (avgWearFl || 4))}
          </div>
        </div>
      </div>

      {/* Lap by Lap Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm font-mono">
          <thead className="bg-neutral-950 text-neutral-400 uppercase text-xs border-b border-neutral-800">
            <tr>
              <th className="py-3 px-4">Lap</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Delta</th>
              <th className="py-3 px-4">Sector 1</th>
              <th className="py-3 px-4">Sector 2</th>
              <th className="py-3 px-4">Sector 3</th>
              <th className="py-3 px-4">Speed Trap</th>
              <th className="py-3 px-4">Fuel Used</th>
              <th className="py-3 px-4">FL Wear Δ</th>
              <th className="py-3 px-4">Handling Events</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/60">
            {completedLaps.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-neutral-500 text-xs">
                  No laps recorded yet. Complete laps in F1 2020 or enable Demo Mode to see live telemetry!
                </td>
              </tr>
            ) : (
              completedLaps.map((lap) => {
                const isBest = bestLap && lap.lapNumber === bestLap.lapNumber;
                const isS1Best = minS1 !== null && lap.sector1 && Math.abs(lap.sector1 - minS1) < 0.01;
                const isS2Best = minS2 !== null && lap.sector2 && Math.abs(lap.sector2 - minS2) < 0.01;
                const isS3Best = minS3 !== null && lap.sector3 && Math.abs(lap.sector3 - minS3) < 0.01;

                return (
                  <tr
                    key={lap.lapNumber}
                    className={`hover:bg-neutral-800/40 transition-colors ${
                      isBest ? "bg-purple-950/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                      {isBest && <Award className="w-3.5 h-3.5 text-purple-400" />}
                      L{lap.lapNumber}
                    </td>
                    <td className={`py-3 px-4 font-bold ${isBest ? "text-purple-400" : "text-white"}`}>
                      {lap.lapTimeFormatted}
                    </td>
                    <td className="py-3 px-4">{formatDelta(lap.lapTime)}</td>
                    <td className={`py-3 px-4 ${isS1Best ? "text-purple-400 font-bold" : "text-neutral-300"}`}>
                      {lap.sector1 ? `${lap.sector1.toFixed(3)}s` : "-"}
                    </td>
                    <td className={`py-3 px-4 ${isS2Best ? "text-purple-400 font-bold" : "text-neutral-300"}`}>
                      {lap.sector2 ? `${lap.sector2.toFixed(3)}s` : "-"}
                    </td>
                    <td className={`py-3 px-4 ${isS3Best ? "text-purple-400 font-bold" : "text-neutral-300"}`}>
                      {lap.sector3 ? `${lap.sector3.toFixed(3)}s` : "-"}
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">
                      {lap.maxSpeedKmh} <span className="text-[10px] text-neutral-500 font-normal">km/h</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {lap.fuelUsedKg.toFixed(2)} kg
                    </td>
                    <td className="py-3 px-4 text-amber-400">
                      +{lap.tyreWearDelta?.fl?.toFixed(1) || "4.1"}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        {(lap.oversteerEvents || 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950/60 text-red-400 border border-red-800">
                            OS: {lap.oversteerEvents}
                          </span>
                        )}
                        {(lap.understeerEvents || 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/60 text-amber-400 border border-amber-800">
                            US: {lap.understeerEvents}
                          </span>
                        )}
                        {!lap.oversteerEvents && !lap.understeerEvents && (
                          <span className="text-neutral-500 text-xs">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
