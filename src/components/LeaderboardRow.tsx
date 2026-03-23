"use client";

interface LeaderboardRowProps {
  rank: number;
  initials: string;
  name: string;
  sub: string;
  score: number;
  colorBg: string;
  colorFg: string;
}

function rankColor(rank: number): string {
  if (rank === 1) return "#BA7517";
  if (rank === 2) return "#888780";
  if (rank === 3) return "#854F0B";
  return "var(--inkl)";
}

export default function LeaderboardRow({
  rank,
  initials,
  name,
  sub,
  score,
  colorBg,
  colorFg,
}: LeaderboardRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 0",
        borderBottom: "0.5px solid var(--bf)",
      }}
    >
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: "18px",
          color: rankColor(rank),
          width: "20px",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        {rank}
      </div>
      <div
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          fontWeight: 600,
          flexShrink: 0,
          background: colorBg,
          color: colorFg,
        }}
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "16px",
            color: "var(--ink)",
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: "10px", color: "var(--inkl)" }}>{sub}</div>
      </div>
      <span
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: "22px",
          color: "var(--ink)",
          flexShrink: 0,
        }}
      >
        {score}
      </span>
      <span
        style={{
          fontSize: "10px",
          color: "var(--inkl)",
          fontFamily: "system-ui",
        }}
      >
        {" "}
        lj
      </span>
    </div>
  );
}
