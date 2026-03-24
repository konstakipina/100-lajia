"use client";

import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import NotificationBar from "@/components/NotificationBar";
import SpeciesSearch from "@/components/SpeciesSearch";
import SelectedSpeciesCard from "@/components/SelectedSpeciesCard";
import SightingForm from "@/components/SightingForm";
import FeedItem from "@/components/FeedItem";
import LoadingIndicator from "@/components/LoadingIndicator";
import ErrorMessage from "@/components/ErrorMessage";
import * as api from "@/lib/api";
import type { Species, SightingDisplay, CurrentUser } from "@/types";

export default function OmatHavainnotPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [mySightings, setMySightings] = useState<SightingDisplay[]>([]);
  const [selected, setSelected] = useState<Species | null>(null);
  const [userSpeciesIds, setUserSpeciesIds] = useState<Set<string>>(new Set());
  const [notif, setNotif] = useState({ visible: false, message: "", sub: "" });
  const [formKey, setFormKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const me = await api.getMe();
      setUser(me);
      const species = await api.listSpecies();
      setSpeciesList(species);
      const sightings = await api.listSightings({ user_id: me.profile.id });
      setMySightings(sightings);
      const seen = new Set(sightings.map((s) => s.species_id));
      setUserSpeciesIds(seen);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelect = useCallback((species: Species) => {
    setSelected(species);
  }, []);

  const handleSave = useCallback(
    async (data: {
      date: string;
      location_name: string;
      observer_id: string;
    }) => {
      if (!selected) return;
      const isNew = !userSpeciesIds.has(selected.id);
      const sighting = await api.createSighting({
        species_id: selected.id,
        observer_id: data.observer_id,
        date: data.date,
        location_name: data.location_name,
      });
      setMySightings((prev) => [sighting, ...prev]);
      setUserSpeciesIds((prev) => new Set([...prev, selected.id]));
      setSelected(null);
      setFormKey((k) => k + 1);
      setNotif({
        visible: true,
        message: isNew ? "Uusi laji!" : "Tallennettu",
        sub: selected.name_fi,
      });
    },
    [selected, userSpeciesIds]
  );

  const uniqueCount = userSpeciesIds.size;
  const teamName = user?.team?.name ?? "—";
  const today = new Date().toLocaleDateString("fi-FI", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  // Capitalize first letter
  const todayStr = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <NotificationBar
        message={notif.message}
        sub={notif.sub}
        visible={notif.visible}
        onDismiss={() => setNotif((n) => ({ ...n, visible: false }))}
      />
      <TopBar
        title="Omat havainnot"
        meta={`${teamName} · ${todayStr}`}
      />
      {loading && <LoadingIndicator />}
      {error && <ErrorMessage message={error} onRetry={loadData} />}
      {!loading && !error && (user && !user.team ? (
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--card)",
              border: "0.5px solid var(--border)",
              borderRadius: "10px",
              padding: "24px",
              textAlign: "center",
              maxWidth: "320px",
            }}
          >
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "22px",
                color: "var(--ink)",
                marginBottom: "8px",
              }}
            >
              Ei joukkuetta vielä
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--inkm)",
                lineHeight: 1.6,
              }}
            >
              Sinut ei ole vielä liitetty joukkueeseen. Ota yhteyttä
              järjestäjään, niin pääset kirjaamaan havaintoja.
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            flex: 1,
          }}
        >
          <SpeciesSearch
            key={formKey}
            species={speciesList}
            onSelect={handleSelect}
          />

          {selected && (
            <>
              <SelectedSpeciesCard
                species={selected}
                isNew={!userSpeciesIds.has(selected.id)}
              />
              <SightingForm
                teammates={user ? [user.profile, ...user.teammates] : []}
                currentUserId={user?.profile.id ?? ""}
                onSave={handleSave}
              />
            </>
          )}

          {mySightings.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: ".07em",
                  textTransform: "uppercase",
                  color: "var(--inkl)",
                  paddingBottom: "8px",
                }}
              >
                {mySightings.length} havaintoa · {uniqueCount} lajia
              </div>
              {mySightings.map((s, i) => (
                <FeedItem key={s.id} sighting={s} index={i} />
              ))}
            </div>
          )}
        </div>
      ))}
      <BottomNav />
    </div>
  );
}
