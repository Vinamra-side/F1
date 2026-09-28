"use client";

import React, { useState } from "react";
import { User, Check, Edit2, Users, Search, X, Shield, Flag } from "lucide-react";
import { Participant } from "@/lib/types";
import { F1_OFFICIAL_DRIVERS } from "@/lib/f1_constants";

interface DriverSelectorProps {
  currentDriverName: string;
  onSaveDriverName: (name: string, carIndex?: number) => void;
  participants: Participant[];
}

export function DriverSelector({
  currentDriverName,
  onSaveDriverName,
  participants,
}: DriverSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState(currentDriverName);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"session" | "roster" | "custom">("session");

  // Check if current driver matches an official driver
  const matchedOfficial = F1_OFFICIAL_DRIVERS.find(
    (d) => d.name.toLowerCase() === (currentDriverName || "").toLowerCase()
  );

  const handleSelectDriver = (name: string, carIndex?: number) => {
    onSaveDriverName(name, carIndex);
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      handleSelectDriver(customName.trim());
    }
  };

  const filteredOfficial = F1_OFFICIAL_DRIVERS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.number.toString().includes(searchQuery)
  );

  return (
    <>
      {/* Top Header Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/50 px-3 py-1.5 rounded-xl transition-all shadow-sm group"
        title="Click to select or switch active player"
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] text-white shadow-inner"
          style={{ backgroundColor: matchedOfficial?.teamColor || "#06b6d4" }}
        >
          {matchedOfficial?.number || (currentDriverName ? currentDriverName[0].toUpperCase() : "P")}
        </div>
        <div className="text-left font-mono">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider leading-none">
            Active Player
          </div>
          <div className="text-xs font-bold text-white flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
            {currentDriverName || "Select Driver"}
            <Edit2 className="w-2.5 h-2.5 text-neutral-500 group-hover:text-cyan-400 ml-0.5" />
          </div>
        </div>
      </button>

      {/* Driver Selector Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="font-mono text-base font-bold text-white">
                  Select Player / Driver
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Banner */}
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                  style={{ backgroundColor: matchedOfficial?.teamColor || "#06b6d4" }}
                >
                  {matchedOfficial?.number || "#"}
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase">Currently Tracking</div>
                  <div className="font-bold text-sm text-white">{currentDriverName}</div>
                  {matchedOfficial && (
                    <div className="text-[11px] text-neutral-400">{matchedOfficial.team}</div>
                  )}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
                TELEMETRY ACTIVE
              </span>
            </div>

            {/* Selector Tabs */}
            <div className="flex border-b border-neutral-800 gap-2 font-mono text-xs font-bold">
              <button
                onClick={() => setActiveTab("session")}
                className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "session"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                Live In-Game Cars ({participants.length})
              </button>
              <button
                onClick={() => setActiveTab("roster")}
                className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "roster"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                F1 2020 Official Grid (20)
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "custom"
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Custom Driver Name
              </button>
            </div>

            {/* TAB 1: In-Game Session Participants */}
            {activeTab === "session" && (
              <div className="space-y-3">
                <p className="text-xs font-mono text-neutral-400">
                  Drivers detected from your current F1 2020 session UDP telemetry:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {participants.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 font-mono text-xs">
                      No participants received yet from UDP packet 4.
                      <br />Launch F1 2020 or switch to the &quot;F1 2020 Official Grid&quot; tab.
                    </div>
                  ) : (
                    participants.map((p) => {
                      const isSelected = p.name.toLowerCase() === currentDriverName.toLowerCase();
                      return (
                        <div
                          key={p.carIndex}
                          onClick={() => handleSelectDriver(p.name, p.carIndex)}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between font-mono text-xs transition-all ${
                            isSelected
                              ? "bg-cyan-950/40 border-cyan-500 text-white shadow-sm"
                              : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                              #{p.raceNumber || p.carIndex + 1}
                            </span>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                {p.name}
                                {!p.isAi && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-900 text-cyan-300 border border-cyan-700">
                                    HUMAN
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-500">
                                Car Index: {p.carIndex} {p.isAi ? "• AI Driver" : "• Player Car"}
                              </div>
                            </div>
                          </div>
                          {isSelected ? (
                            <Check className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <button className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-[11px] text-neutral-300">
                              Select
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Official 2020 F1 Grid Roster */}
            {activeTab === "roster" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search driver, team, or car number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {filteredOfficial.map((d) => {
                    const isSelected = d.name.toLowerCase() === currentDriverName.toLowerCase();
                    return (
                      <div
                        key={d.id}
                        onClick={() => handleSelectDriver(d.name)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between font-mono text-xs transition-all ${
                          isSelected
                            ? "bg-cyan-950/40 border-cyan-500 text-white"
                            : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-inner"
                            style={{ backgroundColor: d.teamColor }}
                          >
                            {d.number}
                          </div>
                          <div>
                            <div className="font-bold text-white">{d.name}</div>
                            <div className="text-[10px] text-neutral-500">{d.team}</div>
                          </div>
                        </div>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <button className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-[11px] text-neutral-300">
                            Select
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Custom Player Name Input */}
            {activeTab === "custom" && (
              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                  Enter your in-game Driver Name, Career Mode name, or gamer tag. The AI race engineer and relay will filter and focus on your car:
                </p>
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 uppercase block mb-1.5">
                    Your In-Game Driver Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Vinamra"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-mono text-xs font-bold rounded-xl transition-colors shadow-lg shadow-cyan-950"
                >
                  Set Active Driver
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
