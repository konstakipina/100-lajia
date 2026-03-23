"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import LeaderboardRow from "@/components/LeaderboardRow";
import * as api from "@/lib/api";
import type { Standings } from "@/types";

export default function StandingsPage() {
  const [standings, setStandings] = useState<Standings | null>(null);

  useEffect(() => {
    api.getStandings().then(setStandings);
  }, []);

  const today = new Date().toLocaleDateString("fi-FI", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const todayStr = today.charAt(0).toUpperCase() + today.slice(1);

  const sectionHead: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: ".07em",
    textTransform: "uppercase",
    color: "var(--inkl)",
    paddingBottom: "8px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopBar title="Kilpailutilanne" meta={todayStr} />
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          flex: 1,
        }}
      >
        {standings && (
          <>
            <div>
              <div style={sectionHead}>Joukkueet</div>
              {standings.teams.map((t, i) => (
                <LeaderboardRow
                  key={t.team.id}
                  rank={i + 1}
                  initials={t.team.initials}
                  name={t.team.name}
                  sub={`${t.member_count} jäsentä`}
                  score={t.score}
                  colorBg={t.team.color_bg}
                  colorFg={t.team.color_fg}
                />
              ))}
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "0.5px solid var(--border)",
                margin: "4px 0 16px",
              }}
            />

            <div>
              <div style={sectionHead}>Yksilöt</div>
              {standings.individuals.map((u, i) => (
                <LeaderboardRow
                  key={u.profile.id}
                  rank={i + 1}
                  initials={
                    u.profile.display_name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  }
                  name={u.profile.display_name}
                  sub={u.team.name}
                  score={u.score}
                  colorBg={u.team.color_bg}
                  colorFg={u.team.color_fg}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
