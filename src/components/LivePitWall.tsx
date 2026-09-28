"use client";

import React from "react";
import { LiveTelemetry, LiveMotion, LiveStatus } from "@/lib/types";
import { Zap, Gauge, Flame, Wind } from "lucide-react";

interface LivePitWallProps {
  telemetry: LiveTelemetry;
  motion: LiveMotion;
  status: LiveStatus;
}

export function LivePitWall({ telemetry, motion, status }: LivePitWallProps) {
  const speed = telemetry.speed || 0;
  const gear = telemetry.gear;
  const rpm = telemetry.engineRPM || 0;
  const throttle = Math.round((telemetry.throttle || 0) * 100);
  const brake = Math.round((telemetry.brake || 0) * 100);
  const steer = telemetry.steer || 0;
  const drs = telemetry.drs;
  const ersEnergy = status.ersStoreEnergy || 0;
  const ersPercent = Math.min(100, Math.round((ersEnergy / 4000000) * 100));
  const fuelLaps = status.fuelRemainingLaps || 0;
  const fuelTank = status.fuelInTank || 0;

  // Rev lights: 15 lights (5 green, 5 red, 5 purple/blue)
  const maxRpm = 13500;
  const rpmFraction = Math.max(0, Math.min(1, (rpm - 4000) / (maxRpm - 4000)));
  const activeLights = Math.round(rpmFraction * 15);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-2xl space-y-5">
      {/* Top Banner: Shift Lights & DRS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        {/* F1 LED Shift Lights */}
        <div className="flex items-center space-x-1.5 bg-neutral-950 px-4 py-2 rounded-lg border border-neutral-800">
          {Array.from({ length: 15 }).map((_, i) => {
            const isActive = i < activeLights;
            let activeColor = "bg-emerald-500 shadow-[0_0_8px_#10b981]";
            if (i >= 5 && i < 10) {
              activeColor = "bg-red-500 shadow-[0_0_8px_#ef4444]";
            } else if (i >= 10) {
              activeColor = "bg-purple-500 shadow-[0_0_10px_#a855f7]";
            }
            return (
              <div
                key={i}
                className={`w-3.5 h-6 rounded-sm transition-all duration-75 ${
                  isActive ? activeColor : "bg-neutral-800"
                }`}
              />
            );
          })}
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              drs
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 animate-pulse"
                : status.drsAllowed
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                : "bg-neutral-800 text-neutral-500"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            DRS {drs ? "ACTIVE" : status.drsAllowed ? "AVAILABLE" : "OFF"}
          </div>

          <div className="px-3 py-1.5 bg-neutral-800 rounded-md font-mono text-xs text-neutral-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            {status.tyreCompound || "Dry"}
          </div>
        </div>
      </div>

      {/* Main Instruments Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Speedometer */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-neutral-500 text-xs font-mono uppercase tracking-wider">Speed</span>
          <div className="text-5xl font-black font-mono tracking-tighter text-white mt-1">
            {speed}
          </div>
          <span className="text-neutral-500 text-xs font-mono">KM/H</span>
          <div className="w-full bg-neutral-800 h-1 mt-3 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-100"
              style={{ width: `${Math.min(100, (speed / 360) * 100)}%` }}
            />
          </div>
        </div>

        {/* Gear & RPM */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col items-center justify-center">
          <span className="text-neutral-500 text-xs font-mono uppercase tracking-wider">Gear</span>
          <div className="text-5xl font-black font-mono tracking-tighter text-cyan-400 mt-1">
            {gear === 0 ? "N" : gear === -1 ? "R" : gear}
          </div>
          <span className="text-neutral-400 text-xs font-mono">{rpm.toLocaleString()} RPM</span>
        </div>

        {/* ERS Energy Store */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs font-mono uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> ERS Battery
            </span>
            <span className="text-yellow-400 font-mono text-sm font-bold">{ersPercent}%</span>
          </div>
          <div className="my-2">
            <div className="w-full bg-neutral-800 h-3 rounded-md overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full transition-all duration-200"
                style={{ width: `${ersPercent}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] font-mono text-neutral-400 flex justify-between">
            <span>Deploy Mode:</span>
            <span className="text-neutral-200 font-semibold">Hotlap</span>
          </div>
        </div>

        {/* Fuel remaining */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs font-mono uppercase tracking-wider flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Fuel Range
            </span>
            <span
              className="font-mono text-sm font-bold text-emerald-400"
            >
              {fuelLaps.toFixed(1)} laps
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-white my-1">
            {fuelTank.toFixed(1)} <span className="text-xs text-neutral-500 font-normal">KG</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400 flex justify-between">
            <span>Lap Target:</span>
            <span className="text-neutral-200">~1.82 kg/lap</span>
          </div>
        </div>
      </div>

      {/* Pedals & Steering Live Trace */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
        {/* Throttle Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-neutral-400">Throttle</span>
            <span className="text-emerald-400 font-bold">{throttle}%</span>
          </div>
          <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-75"
              style={{ width: `${throttle}%` }}
            />
          </div>
        </div>

        {/* Brake Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-neutral-400">Brake</span>
            <span className="text-red-400 font-bold">{brake}%</span>
          </div>
          <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-75"
              style={{ width: `${brake}%` }}
            />
          </div>
        </div>

        {/* Steering & G-Force */}
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-3">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-neutral-400">Steering</span>
              <span className="text-cyan-400 font-bold">
                {steer > 0 ? `R ${(steer * 100).toFixed(0)}%` : steer < 0 ? `L ${(Math.abs(steer) * 100).toFixed(0)}%` : "0%"}
              </span>
            </div>
            {/* Bi-directional steer bar */}
            <div className="w-full bg-neutral-800 h-3 rounded-full relative overflow-hidden flex items-center justify-center">
              <div className="w-0.5 h-full bg-neutral-600 z-10" />
              <div
                className="absolute top-0 bottom-0 bg-cyan-500 transition-all duration-75"
                style={{
                  left: steer < 0 ? `${50 + steer * 50}%` : "50%",
                  width: `${Math.abs(steer) * 50}%`,
                }}
              />
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-neutral-500 block uppercase">Lateral G</span>
            <span className="font-mono text-sm font-bold text-white">
              {Math.abs(motion.gForceLateral || 0).toFixed(1)}G
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
