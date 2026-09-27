"use client";

import React, { useState } from "react";
import { Wifi, Cloud, PlayCircle, Server, RefreshCw, CheckCircle, X } from "lucide-react";

export type ConnectionSource = "cloud" | "lan" | "demo";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSource: ConnectionSource;
  lanUrl: string;
  onSelectSource: (source: ConnectionSource, customLanUrl?: string) => void;
  isConnected: boolean;
  lastPingMs: number;
}

export function ConnectionModal({
  isOpen,
  onClose,
  activeSource,
  lanUrl,
  onSelectSource,
  isConnected,
  lastPingMs,
}: ConnectionModalProps) {
  const [customLan, setCustomLan] = useState(lanUrl || "http://192.168.1.100:8080");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-base font-bold text-white">
              Telemetry Connection Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Badge */}
        <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-red-500"
              }`}
            />
            <span className="text-neutral-300">
              {isConnected ? "LIVE STREAM ACTIVE" : "AWAITING TELEMETRY"}
            </span>
          </div>
          <span className="text-neutral-500">Latency: {lastPingMs}ms</span>
        </div>

        {/* Connection Options */}
        <div className="space-y-3 font-mono">
          {/* Option 1: Vercel Cloud Sync */}
          <div
            onClick={() => onSelectSource("cloud")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeSource === "cloud"
                ? "bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-400" /> Vercel Cloud Sync (Recommended)
              </span>
              {activeSource === "cloud" && <CheckCircle className="w-4 h-4 text-cyan-400" />}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Connects to your deployed Vercel URL. Gaming PC sends data to <code>/api/ingest</code>, and any laptop views it seamlessly anywhere!
            </p>
          </div>

          {/* Option 2: Direct Local LAN */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              activeSource === "lan"
                ? "bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => onSelectSource("lan", customLan)}
            >
              <span className="font-bold text-sm flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" /> Direct Home Wi-Fi / LAN (Zero Lag)
              </span>
              {activeSource === "lan" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-xs text-neutral-400 mt-1 mb-2">
              Connects directly to your Gaming PC IP running <code>f1_relay.py</code> over local Wi-Fi with sub-5ms delay.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customLan}
                onChange={(e) => setCustomLan(e.target.value)}
                placeholder="http://192.168.1.XX:8080"
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white flex-1 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={() => onSelectSource("lan", customLan)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Connect
              </button>
            </div>
          </div>

          {/* Option 3: Offline Bahrain Simulation Demo */}
          <div
            onClick={() => onSelectSource("demo")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeSource === "demo"
                ? "bg-purple-950/40 border-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-purple-400" /> Interactive Bahrain GP Demo
              </span>
              {activeSource === "demo" && <CheckCircle className="w-4 h-4 text-purple-400" />}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Plays realistic high-speed telemetry with full laps, tyre degradation, and race engineer suggestions without needing the game open.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
