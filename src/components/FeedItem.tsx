"use client";

import type { SightingDisplay } from "@/types";

interface FeedItemProps {
  sighting: SightingDisplay;
  index: number;
  showObserver?: boolean;
}

export default function FeedItem({
  sighting,
  index,
  showObserver = false,
}: FeedItemProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "12px 0",
        borderBottom: "0.5px solid var(--bf)",
      }}
    >
      <div
        style={{
          width: "22px",
          flexShrink: 0,
          fontFamily: "'Caveat', cursive",
          fontSize: "17px",
          color: "var(--inkl)",
          paddingTop: "2px",
        }}
      >
        {index + 1}
      </div>
      <div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "18px",
            color: "var(--ink)",
            display: "flex",
            alignItems: "baseline",
            gap: "3px",
          }}
        >
          {sighting.species_name_fi}
          {sighting.is_new_for_user && (
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "22px",
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
            fontSize: "12px",
            color: "var(--inkm)",
          }}
        >
          {sighting.species_name_sci}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "var(--inkl)",
            marginTop: "2px",
          }}
        >
          {showObserver
            ? `${sighting.observer_name} · ${sighting.team_name} · `
            : ""}
          {sighting.date}
          {sighting.location_name ? ` · ${sighting.location_name}` : ""}
        </div>
      </div>
    </div>
  );
}
