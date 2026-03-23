"use client";

interface FilterBarProps {
  teamNames: string[];
  activeTeam: string;
  onTeamChange: (team: string) => void;
  observerNames: string[];
  activeObserver: string;
  onObserverChange: (observer: string) => void;
}

const pillBase: React.CSSProperties = {
  padding: "5px 13px",
  borderRadius: "99px",
  border: "0.5px solid var(--border)",
  background: "transparent",
  fontSize: "12px",
  color: "var(--inkm)",
  cursor: "pointer",
  fontFamily: "system-ui",
  whiteSpace: "nowrap",
};
const pillActive: React.CSSProperties = {
  ...pillBase,
  background: "var(--ink)",
  color: "var(--p)",
  borderColor: "var(--ink)",
};
const labelStyle: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: ".07em",
  textTransform: "uppercase",
  color: "var(--inkl)",
  marginBottom: "5px",
};

export default function FilterBar({
  teamNames,
  activeTeam,
  onTeamChange,
  observerNames,
  activeObserver,
  onObserverChange,
}: FilterBarProps) {
  const allTeams = ["Kaikki", ...teamNames];
  const showObservers = activeTeam !== "Kaikki" && observerNames.length > 0;
  const allObservers = showObservers ? ["Kaikki", ...observerNames] : [];

  return (
    <div
      style={{
        padding: "12px 20px",
        borderBottom: "0.5px solid var(--bf)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div>
        <div style={labelStyle}>Joukkue</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {allTeams.map((t) => (
            <button
              key={t}
              onClick={() => onTeamChange(t)}
              style={activeTeam === t ? pillActive : pillBase}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {showObservers && (
        <div>
          <div style={labelStyle}>Havainnoija</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {allObservers.map((o) => (
              <button
                key={o}
                onClick={() => onObserverChange(o)}
                style={activeObserver === o ? pillActive : pillBase}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
