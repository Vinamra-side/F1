"use client";

import React from "react";
import { TyreQuad } from "@/lib/types";
import { Thermometer, Disc, Activity, AlertTriangle } from "lucide-react";

interface TyreMatrixProps {
  innerTemps: TyreQuad<number>;
  surfaceTemps: TyreQuad<number>;
  brakesTemp: TyreQuad<number>;
  tyresPressure: TyreQuad<number>;
  tyreWear: TyreQuad<number>;
}

export function TyreMatrix({
  innerTemps,
  surfaceTemps,
  brakesTemp,
  tyresPressure,
  tyreWear,
}: TyreMatrixProps) {
  // Returns color class based on inner tyre core temp (optimal is 95 - 104 C)
  const getTempColor = (temp: number) => {
    if (temp < 88) return "text-cyan-400 bg-cyan-950/40 border-cyan-800";
    if (temp <= 104) return "text-emerald-400 bg-emerald-950/40 border-emerald-800";
    if (temp <= 109) return "text-amber-400 bg-amber-950/40 border-amber-800";
    return "text-red-400 bg-red-950/50 border-red-800 animate-pulse";
  };

  const getBrakeTempColor = (temp: number) => {
    if (temp < 250) return "text-cyan-400";
    if (temp < 650) return "text-emerald-400";
    if (temp < 850) return "text-amber-400";
    return "text-red-400 font-bold";
  };

  const renderTyreCorner = (
    key: "fl" | "fr" | "rl" | "rr",
    label: string,
    position: "left" | "right"
  ) => {
    const inner = innerTemps[key] || 100;
    const surface = surfaceTemps[key] || 100;
    const brake = brakesTemp[key] || 450;
    const psi = tyresPressure[key] || 22.0;
    const wear = tyreWear[key] || 0.0;
    const tempClass = getTempColor(inner);

    return (
      <div
        className={`bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:border-neutral-700`}
      >
        {/* Corner Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <span className="font-mono text-sm font-bold text-neutral-200">{label}</span>
          <span
            className={`font-mono text-xs px-2 py-0.5 rounded border ${tempClass}`}
          >
            {inner}°C CORE
          </span>
        </div>

        {/* Tyre Graphic & Wear Indicator */}
        <div className="my-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Surface</span>
            <span className="text-xl font-mono font-bold text-white">{surface}°C</span>
          </div>

          {/* Visual Tyre Tread with Wear Bar */}
          <div className="w-12 h-16 bg-neutral-900 border-2 border-neutral-700 rounded-md relative overflow-hidden flex flex-col justify-end p-0.5 shadow-inner">
            <div
              className={`w-full rounded-sm transition-all duration-300 ${
                wear > 50
                  ? "bg-red-500"
                  : wear > 30
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ height: `${Math.min(100, Math.max(10, 100 - wear))}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-white/90 drop-shadow">
              {wear.toFixed(1)}%
            </span>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Pressure</span>
            <span className="text-lg font-mono font-bold text-neutral-200">{psi.toFixed(1)} <span className="text-xs text-neutral-500 font-normal">PSI</span></span>
          </div>
        </div>

        {/* Brake Disc Rotor Temperature */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs font-mono">
          <span className="text-neutral-500 flex items-center gap-1">
            <Disc className="w-3.5 h-3.5 text-neutral-400" /> Brake Temp:
          </span>
          <span className={getBrakeTempColor(brake)}>{brake}°C</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" /> 4-Wheel Tyre & Brake Thermal Matrix
        </h3>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> Optimal 95-104°C
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" /> Warm
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 ml-2" /> Overheating &gt;109°C
        </div>
      </div>

      {/* 2x2 Car Wheel Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Front Axle */}
        {renderTyreCorner("fl", "FRONT LEFT (FL)", "left")}
        {renderTyreCorner("fr", "FRONT RIGHT (FR)", "right")}

        {/* Rear Axle */}
        {renderTyreCorner("rl", "REAR LEFT (RL)", "left")}
        {renderTyreCorner("rr", "REAR RIGHT (RR)", "right")}
      </div>
    </div>
  );
}
