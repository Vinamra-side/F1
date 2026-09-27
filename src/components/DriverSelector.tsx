"use client";

import React, { useState } from "react";
import { User, Check, Edit2, Users } from "lucide-react";
import { Participant } from "@/lib/types";

interface DriverSelectorProps {
  currentDriverName: string;
  onSaveDriverName: (name: string) => void;
  participants: Participant[];
}

export function DriverSelector({
  currentDriverName,
  onSaveDriverName,
  participants,
}: DriverSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentDriverName);

  const handleSave = () => {
    if (nameInput.trim()) {
      onSaveDriverName(nameInput.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded-lg p-1">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Driver Name..."
            autoFocus
            className="bg-transparent text-white font-mono text-xs px-2 py-0.5 focus:outline-none w-32"
          />
          <button
            onClick={handleSave}
            className="p-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-xs font-bold text-white">
              {currentDriverName || "Vinamra"}
            </span>
            <Edit2 className="w-3 h-3 text-neutral-500 hover:text-neutral-300" />
          </div>

          {participants.length > 1 && (
            <select
              value={currentDriverName}
              onChange={(e) => onSaveDriverName(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500"
            >
              <option value={currentDriverName}>{currentDriverName} (Active)</option>
              {participants
                .filter((p) => p.name && p.name !== currentDriverName)
                .map((p) => (
                  <option key={p.carIndex} value={p.name}>
                    {p.name} {p.isAi ? "(AI)" : ""}
                  </option>
                ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
