"use client";

import React, { useState, useEffect } from "react";
import { TelemetrySnapshot } from "@/lib/types";
import { createDefaultSnapshot } from "@/lib/telemetry_store";
import { LivePitWall } from "@/components/LivePitWall";
import { TyreMatrix } from "@/components/TyreMatrix";
import { LapHistory } from "@/components/LapHistory";
import { RaceEngineer } from "@/components/RaceEngineer";
import { ConnectionModal, ConnectionSource } from "@/components/ConnectionModal";
import { DriverSelector } from "@/components/DriverSelector";
import {
  Wrench,
  Activity,
  Timer,
  HelpCircle,
  RotateCcw,
  Wifi,
  Cloud,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(() => createDefaultSnapshot("Vinamra"));
  const [activeTab, setActiveTab] = useState<"engineer" | "telemetry" | "laps" | "guide">("engineer");
  const [activeSource, setActiveSource] = useState<ConnectionSource>("cloud");
  const [lanUrl, setLanUrl] = useState("http://localhost:8080");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPingMs, setLastPingMs] = useState(0);
  const hasLiveTelemetry = isConnected && snapshot.timestamp > 0 && snapshot.session.sessionTypeId !== 0;

  // Live polling for Cloud or LAN sources
  useEffect(() => {
    const interval = setInterval(async () => {
      const endpoint = activeSource === "cloud" ? "/api/live" : `${lanUrl}/api/live`;
      const t0 = performance.now();
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as TelemetrySnapshot;
          if (data && data.telemetry) {
            setSnapshot(data);
            setIsConnected(data.timestamp > 0 && data.session.sessionTypeId !== 0);
            setLastPingMs(Math.round(performance.now() - t0));
          }
        } else {
          setIsConnected(false);
        }
      } catch {
        setIsConnected(false);
      }
    }, activeSource === "lan" ? 200 : 350);

    return () => clearInterval(interval);
  }, [activeSource, lanUrl]);

  const handleSaveDriverName = async (name: string, carIndex?: number) => {
    setSnapshot((prev) => ({
      ...prev,
      driverName: name,
      ...(carIndex !== undefined ? { playerCarIndex: carIndex } : {}),
    }));
    try {
      await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverName: name, carIndex }),
      });
    } catch {
      // Ignore if offline
    }
  };

  const handleResetSession = async () => {
    if (confirm("Reset current telemetry and lap history?")) {
      try {
        await fetch("/api/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driverName: snapshot.driverName }),
        });
      } catch {
        // Fallback local reset
      }
      setSnapshot(createDefaultSnapshot(snapshot.driverName));
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Session Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-red-900/30">
              F1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm font-black tracking-tight text-white uppercase">
                  F1 2020 Race Engineer
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  REAL-TIME PIT WALL
                </span>
              </div>
              {hasLiveTelemetry ? (
                <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
                  <span className="text-cyan-400">{snapshot.session.sessionType}</span>
                  <span>•</span>
                  <span>{snapshot.session.trackName}</span>
                  <span>•</span>
                  <span>{snapshot.session.weather}</span>
                  <span>•</span>
                  <span>Track {snapshot.session.trackTemperature}°C</span>
                </div>
              ) : (
                <p className="text-xs font-mono text-amber-400">Waiting for live F1 telemetry</p>
              )}
            </div>
          </div>

          {/* Action Center: Driver Name, Connection Badge, Settings */}
          <div className="flex items-center gap-3">
            <DriverSelector
              currentDriverName={snapshot.driverName}
              onSaveDriverName={handleSaveDriverName}
              participants={snapshot.participants || []}
            />

            {/* Connection Status Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
            >
              {activeSource === "cloud" ? (
                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline text-neutral-300">
                {activeSource === "cloud" ? "Cloud Sync" : "LAN Direct"}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-red-500"
                }`}
              />
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetSession}
              title="Reset Session"
              className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 flex border-t border-neutral-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab("engineer")}
            className={`py-3 px-4 font-mono text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "engineer"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Wrench className="w-4 h-4" /> AI Race Engineer & Setups
          </button>
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`py-3 px-4 font-mono text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "telemetry"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4" /> Live Pit Wall Telemetry
          </button>
          <button
            onClick={() => setActiveTab("laps")}
            className={`py-3 px-4 font-mono text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "laps"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Timer className="w-4 h-4" /> Lap-to-Lap Analysis ({snapshot.completedLaps.length})
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`py-3 px-4 font-mono text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "guide"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Relay Setup & Vercel Guide
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Active Driver Quick Selection Banner */}
        {hasLiveTelemetry && <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center font-black text-cyan-400 font-mono text-base">
              {snapshot.driverName ? snapshot.driverName[0].toUpperCase() : "P"}
            </div>
            <div>
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                Telemetry Focused On Driver
              </div>
              <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <span>{snapshot.driverName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 font-normal">
                  Car Index: {snapshot.participants?.find((p) => p.name === snapshot.driverName)?.carIndex ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DriverSelector
              currentDriverName={snapshot.driverName}
              onSaveDriverName={handleSaveDriverName}
              participants={snapshot.participants || []}
            />
          </div>
        </div>}

        {!hasLiveTelemetry && activeTab !== "guide" && (
          <section className="min-h-64 rounded-xl border border-amber-700/40 bg-neutral-950 p-8 flex flex-col items-center justify-center text-center">
            <Wifi className="h-8 w-8 text-amber-400" />
            <h2 className="mt-4 text-xl font-black text-white">Waiting for live telemetry</h2>
            <p className="mt-2 max-w-xl text-sm text-neutral-400">
              Start the local relay and open a Practice, Qualifying, or Race session. No simulated values are shown here.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 min-h-10 rounded-md border border-cyan-700 bg-cyan-950/50 px-4 text-sm font-bold text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Check connection
            </button>
          </section>
        )}

        {/* TAB 1: AI Race Engineer & Setups */}
        {hasLiveTelemetry && activeTab === "engineer" && (
          <div className="space-y-6">
            <RaceEngineer snapshot={snapshot} />
            {/* Embedded Live Snapshot for Quick Reference */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LivePitWall
                telemetry={snapshot.telemetry}
                motion={snapshot.motion}
                status={snapshot.status}
              />
              <TyreMatrix
                innerTemps={snapshot.telemetry.tyresInnerTemperature}
                surfaceTemps={snapshot.telemetry.tyresSurfaceTemperature}
                brakesTemp={snapshot.telemetry.brakesTemperature}
                tyresPressure={snapshot.telemetry.tyresPressure}
                tyreWear={snapshot.damage.tyresWear}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Live Pit Wall Telemetry */}
        {hasLiveTelemetry && activeTab === "telemetry" && (
          <div className="space-y-6">
            <LivePitWall
              telemetry={snapshot.telemetry}
              motion={snapshot.motion}
              status={snapshot.status}
            />
            <TyreMatrix
              innerTemps={snapshot.telemetry.tyresInnerTemperature}
              surfaceTemps={snapshot.telemetry.tyresSurfaceTemperature}
              brakesTemp={snapshot.telemetry.brakesTemperature}
              tyresPressure={snapshot.telemetry.tyresPressure}
              tyreWear={snapshot.damage.tyresWear}
            />
          </div>
        )}

        {/* TAB 3: Lap-to-Lap Performance */}
        {hasLiveTelemetry && activeTab === "laps" && (
          <LapHistory
            completedLaps={snapshot.completedLaps}
            currentLapNum={snapshot.lapData.currentLapNum}
            currentLapTime={snapshot.lapData.currentLapTime}
          />
        )}

        {/* TAB 4: Relay & Vercel Deployment Instructions */}
        {activeTab === "guide" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 font-mono text-sm">
            <div className="border-b border-neutral-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                F1 2020 Multi-Device Setup & Vercel Deployment Guide
              </h2>
              <p className="text-neutral-400 text-xs mt-1">
                Follow these simple steps to run the telemetry bridge on your gaming PC and stream live data to your laptop via Vercel.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-3">
                <div className="text-cyan-400 font-bold text-xs uppercase flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">1</span>
                  Configure F1 2020 UDP
                </div>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  In F1 2020 on your gaming PC:
                </p>
                <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                  <li>Go to <strong>Game Options &rarr; Settings &rarr; Telemetry Settings</strong></li>
                  <li>UDP Telemetry: <strong className="text-white">ON</strong></li>
                  <li>UDP Broadcast: <strong className="text-white">ON</strong></li>
                  <li>UDP IP Address: <strong className="text-white">127.0.0.1</strong> (or your LAN IP)</li>
                  <li>UDP Port: <strong className="text-white">20777</strong></li>
                  <li>UDP Send Rate: <strong className="text-white">20Hz</strong> or <strong className="text-white">60Hz</strong></li>
                  <li>UDP Format: <strong className="text-white">2020</strong></li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-3">
                <div className="text-cyan-400 font-bold text-xs uppercase flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">2</span>
                  Deploy to Vercel
                </div>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  Deploy this repository to Vercel with one click:
                </p>
                <div className="bg-neutral-900 p-2.5 rounded border border-neutral-800 text-xs text-neutral-300">
                  <code>git push</code> to your GitHub repo, then import into <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">vercel.com</a>.
                </div>
                <p className="text-xs text-neutral-400">
                  Once deployed, Vercel gives you a URL like:
                  <code className="block mt-1 text-emerald-400">https://f1-2020-engineer.vercel.app</code>
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-3">
                <div className="text-cyan-400 font-bold text-xs uppercase flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">3</span>
                  Start Relay on Gaming PC
                </div>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  On your gaming PC, run the python bridge:
                </p>
                <div className="bg-neutral-900 p-2.5 rounded border border-neutral-800 text-xs text-neutral-300 overflow-x-auto">
                  <code>python relay/f1_relay.py --driver-name &quot;{snapshot.driverName}&quot; --cloud-url https://your-app.vercel.app</code>
                </div>
                <p className="text-xs text-neutral-400">
                  Or simply double-click <strong className="text-white">relay/run_relay.bat</strong>!
                </p>
              </div>
            </div>

            <div className="bg-cyan-950/20 border border-cyan-800/40 p-4 rounded-xl flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-cyan-400 font-bold block">No Internet? Direct LAN Connection Works Too!</span>
                <span className="text-neutral-400 text-xs">
                  If both laptops are on the same Wi-Fi, you don&apos;t even need Vercel! Start <code>f1_relay.py</code> on your gaming PC, click the Connection button at the top right, select <strong>Direct Home Wi-Fi / LAN</strong>, and type your Gaming PC&apos;s IP (e.g. <code>http://192.168.1.105:8080</code>).
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-4 px-6 text-center text-xs font-mono text-neutral-500">
        F1 2020 Race Engineer & Telemetry Bridge • Codemasters F1 2020 UDP 20777 • Ready for Vercel Deployment
      </footer>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeSource={activeSource}
        lanUrl={lanUrl}
        onSelectSource={(src, customUrl) => {
          setActiveSource(src);
          if (customUrl) setLanUrl(customUrl);
          setIsModalOpen(false);
        }}
        isConnected={isConnected}
        lastPingMs={lastPingMs}
      />
    </div>
  );
}
