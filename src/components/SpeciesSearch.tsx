"use client";

import { useState, useRef, useEffect } from "react";
import type { Species } from "@/types";

interface SpeciesSearchProps {
  species: Species[];
  onSelect: (species: Species) => void;
}

export default function SpeciesSearch({
  species,
  onSelect,
}: SpeciesSearchProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const hits = query
    ? species
        .filter(
          (s) =>
            s.name_fi.toLowerCase().includes(query.toLowerCase()) ||
            s.name_sci.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 7)
    : [];

  useEffect(() => {
    setShowDropdown(hits.length > 0 && query.length > 0);
  }, [hits.length, query]);

  function handlePick(s: Species) {
    setQuery(s.name_fi);
    setShowDropdown(false);
    onSelect(s);
  }

  /** Reset search after a sighting is saved */
  function reset() {
    setQuery("");
    setShowDropdown(false);
  }

  // Expose reset via ref if needed — or parent can key-remount
  // For now, parent will pass a key prop to remount after save

  return (
    <div ref={wrapRef}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: ".07em",
          textTransform: "uppercase",
          color: "var(--inkl)",
          marginBottom: "7px",
        }}
      >
        Kirjaa havainto
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Mitä näit?"
        autoComplete="off"
        style={{
          width: "100%",
          border: "none",
          borderBottom: "1px solid var(--border)",
          background: "transparent",
          padding: "10px 0",
          fontFamily: "'Caveat', cursive",
          fontSize: "22px",
          color: "var(--ink)",
          outline: "none",
        }}
      />
      {showDropdown && (
        <div
          style={{
            border: "0.5px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
            background: "var(--card)",
            marginTop: "4px",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {hits.map((s) => (
            <div
              key={s.id}
              onClick={() => handlePick(s)}
              style={{
                padding: "11px 14px",
                borderBottom: "0.5px solid var(--bf)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "18px",
                  color: "var(--ink)",
                }}
              >
                {s.name_fi}
              </div>
              <div
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  fontStyle: "italic",
                  fontSize: "12px",
                  color: "var(--inkl)",
                }}
              >
                {s.name_sci}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
