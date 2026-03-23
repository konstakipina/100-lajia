"use client";

import type { Species } from "@/types";

interface SelectedSpeciesCardProps {
  species: Species;
  isNew: boolean;
}

export default function SelectedSpeciesCard({
  species,
  isNew,
}: SelectedSpeciesCardProps) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "0.5px solid var(--border)",
        borderRadius: "10px",
        padding: "14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "26px",
            color: "var(--ink)",
          }}
        >
          {species.name_fi}
        </span>
        {isNew && (
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "30px",
              color: "var(--acc)",
            }}
          >
            *
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontStyle: "italic",
          fontSize: "13px",
          color: "var(--inkl)",
          marginTop: "2px",
        }}
      >
        {species.name_sci}
      </div>
    </div>
  );
}
