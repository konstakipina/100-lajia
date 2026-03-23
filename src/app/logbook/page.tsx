"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import FilterBar from "@/components/FilterBar";
import FeedItem from "@/components/FeedItem";
import LoadingIndicator from "@/components/LoadingIndicator";
import ErrorMessage from "@/components/ErrorMessage";
import * as api from "@/lib/api";
import type { SightingDisplay, TeamWithMembers } from "@/types";

export default function LogbookPage() {
  const [sightings, setSightings] = useState<SightingDisplay[]>([]);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [activeTeam, setActiveTeam] = useState("Kaikki");
  const [activeObserver, setActiveObserver] = useState("Kaikki");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, t] = await Promise.all([
        api.listSightings(),
        api.listTeams(),
      ]);
      setSightings(s);
      setTeams(t);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const teamNames = useMemo(() => teams.map((t) => t.name), [teams]);

  const observerNames = useMemo(() => {
    if (activeTeam === "Kaikki") return [];
    const team = teams.find((t) => t.name === activeTeam);
    return team ? team.members.map((m) => m.display_name) : [];
  }, [activeTeam, teams]);

  const filtered = useMemo(() => {
    return sightings.filter((s) => {
      const teamOk = activeTeam === "Kaikki" || s.team_name === activeTeam;
      const obsOk =
        activeObserver === "Kaikki" || s.observer_name === activeObserver;
      return teamOk && obsOk;
    });
  }, [sightings, activeTeam, activeObserver]);

  function handleTeamChange(team: string) {
    setActiveTeam(team);
    setActiveObserver("Kaikki");
  }

  const today = new Date().toLocaleDateString("fi-FI", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const todayStr = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopBar
        title="Havaintokirja"
        meta={`${filtered.length} havaintoa · ${todayStr}`}
      />
      <FilterBar
        teamNames={teamNames}
        activeTeam={activeTeam}
        onTeamChange={handleTeamChange}
        observerNames={observerNames}
        activeObserver={activeObserver}
        onObserverChange={setActiveObserver}
      />
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          flex: 1,
        }}
      >
        {loading && <LoadingIndicator />}
        {error && <ErrorMessage message={error} onRetry={loadData} />}
        {!loading && !error && filtered.length > 0 ? (
          filtered.map((s, i) => (
            <FeedItem key={s.id} sighting={s} index={i} showObserver />
          ))
        ) : !loading && !error ? (
          <div style={{ fontSize: "14px", color: "var(--inkl)", padding: "16px 0" }}>
            Ei havaintoja.
          </div>
        ) : null}
      </div>
      <BottomNav />
    </div>
  );
}
