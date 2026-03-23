"use client";

import { useState } from "react";
import type { Profile } from "@/types";

interface SightingFormProps {
  teammates: Profile[];
  currentUserId: string;
  onSave: (data: {
    date: string;
    location_name: string;
    observer_id: string;
  }) => void;
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  borderBottom: "0.5px solid var(--bf)",
};
const rlStyle: React.CSSProperties = {
  width: "80px",
  flexShrink: 0,
  padding: "11px 0 11px 14px",
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "var(--inkl)",
  display: "flex",
  alignItems: "center",
};
const rvStyle: React.CSSProperties = {
  flex: 1,
  borderLeft: "0.5px solid var(--bf)",
  padding: "10px 14px",
};
const inputStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  fontFamily: "'Caveat', cursive",
  fontSize: "18px",
  color: "var(--ink)",
  outline: "none",
  width: "100%",
  padding: 0,
};

export default function SightingForm({
  teammates,
  currentUserId,
  onSave,
}: SightingFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [location, setLocation] = useState("");
  const [observerId, setObserverId] = useState(currentUserId);

  function handleSave() {
    onSave({ date, location_name: location, observer_id: observerId });
    // Reset form
    setDate(today);
    setLocation("");
    setObserverId(currentUserId);
  }

  return (
    <>
      <div
        style={{
          border: "0.5px solid var(--border)",
          borderRadius: "10px",
          overflow: "hidden",
          background: "var(--card)",
        }}
      >
        {/* Date row */}
        <div style={rowStyle}>
          <div style={rlStyle}>Päivä</div>
          <div style={rvStyle}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Location row */}
        <div style={rowStyle}>
          <div style={rlStyle}>Sijainti</div>
          <div style={rvStyle}>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Paikkakunta tai alue"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Observer row */}
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div style={rlStyle}>Kuka</div>
          <div style={{ ...rvStyle, padding: "0 14px" }}>
            <select
              value={observerId}
              onChange={(e) => setObserverId(e.target.value)}
              style={inputStyle}
            >
              {teammates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                  {p.id === currentUserId ? " (minä)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        style={{
          width: "100%",
          padding: "14px",
          background: "var(--ink)",
          color: "var(--p)",
          border: "none",
          borderRadius: "10px",
          fontSize: "15px",
          letterSpacing: ".02em",
          cursor: "pointer",
          fontFamily: "system-ui",
        }}
      >
        Tallenna päiväkirjaan
      </button>
    </>
  );
}
