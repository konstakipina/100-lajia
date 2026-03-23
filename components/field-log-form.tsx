'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

type Species = {
  id: number;
  common_name: string;
  scientific_name: string;
  finnish_name: string | null;
  english_name: string | null;
  image_url: string | null;
};

type Membership = {
  team_id: string;
  competition_id: string;
};

type Teammate = {
  user_id: string;
  display_name: string;
};

type Notification = {
  type: 'success' | 'error';
  text: string;
  species?: string;
  isNew?: boolean;
};

function toLocalDatetimeValue(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function FieldLogForm({
  membership,
  userId,
  teammates = [],
}: {
  membership: Membership | null;
  userId: string;
  teammates?: Teammate[];
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [sightedFor, setSightedFor] = useState(userId);
  const [seenAt, setSeenAt] = useState(toLocalDatetimeValue(new Date()));
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-dismiss notification
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  // Get GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
      },
      () => { /* ignore */ }
    );
  }, []);

  const searchSpecies = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search-species?q=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data: Species[] = await res.json();
        setSuggestions(data);
      }
    }, 200);
  }, []);

  const selectSpecies = (s: Species) => {
    setSelectedSpecies(s);
    setQuery(s.finnish_name || s.common_name);
    setSuggestions([]);
  };

  const resetForm = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedSpecies(null);
    setSightedFor(userId);
    setSeenAt(toLocalDatetimeValue(new Date()));
    setNotes('');
  };

  const onSubmit = async () => {
    if (!membership || !selectedSpecies) return;
    setSubmitting(true);

    const payload = {
      competition_id: membership.competition_id,
      team_id: membership.team_id,
      species_id: selectedSpecies.id,
      entered_by_user_id: userId,
      sighted_for_user_id: sightedFor,
      seen_at: new Date(seenAt).toISOString(),
      latitude: lat ? Number(lat) : null,
      longitude: lon ? Number(lon) : null,
      location_label: locationLabel || null,
      notes: notes || null,
    };

    const res = await fetch('/api/sightings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    const result = await res.json();

    if (!res.ok) {
      const msg = result.error ?? 'Tuntematon virhe';
      if (msg.includes('not registered in competition')) {
        setNotification({ type: 'error', text: 'Joukkuettasi ei ole rekisteröity aktiiviseen kilpailuun.' });
      } else if (msg.includes('not a member')) {
        setNotification({ type: 'error', text: 'Valittu käyttäjä ei ole joukkueesi jäsen.' });
      } else if (msg.includes('outside')) {
        setNotification({ type: 'error', text: 'Havaintopäivä on kilpailuajan ulkopuolella.' });
      } else {
        setNotification({ type: 'error', text: `Tallennus epäonnistui: ${msg}` });
      }
      return;
    }

    const isNew = result.is_new_for_user_year || result.is_new_for_team_year;
    setNotification({
      type: 'success',
      text: isNew ? 'Uusi laji!' : 'Tallennettu',
      species: selectedSpecies.finnish_name || selectedSpecies.common_name,
      isNew,
    });
    resetForm();
  };

  return (
    <>
      {notification && notification.type === 'success' && (
        <div className="save-notification">
          <span className="save-notification-dot" />
          <span className="save-notification-text">{notification.text}</span>
          {notification.species && (
            <span className="save-notification-species">{notification.species}</span>
          )}
        </div>
      )}
      {notification && notification.type === 'error' && (
        <div className="error-notification">{notification.text}</div>
      )}

      <div style={{ padding: '0 18px' }}>
        {/* Vaihe 1: Haku */}
        <input
          className="search-input"
          value={query}
          onChange={(e) => searchSpecies(e.target.value)}
          placeholder="Mitä näit?"
          autoFocus
        />

        {suggestions.length > 0 && (
          <div className="dropdown">
            {suggestions.map((s) => (
              <div key={s.id} className="dropdown-item" onClick={() => selectSpecies(s)}>
                {s.image_url ? (
                  <Image src={s.image_url} alt="" width={38} height={38} className="dropdown-thumb" />
                ) : (
                  <div className="dropdown-thumb" />
                )}
                <div>
                  <div className="dropdown-name">{s.finnish_name || s.common_name}</div>
                  <div className="dropdown-scientific">{s.scientific_name}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vaihe 2: Lajikortti */}
        {selectedSpecies && (
          <div className="species-card">
            {selectedSpecies.image_url ? (
              <Image
                src={selectedSpecies.image_url}
                alt={selectedSpecies.common_name}
                width={480}
                height={160}
                className="species-card-image"
              />
            ) : (
              <div className="species-card-image" style={{ background: 'var(--border-faint)' }} />
            )}
            <div className="species-card-body">
              <div className="species-name-row">
                <span className="text-species">{selectedSpecies.finnish_name || selectedSpecies.common_name}</span>
              </div>
              <div className="species-card-scientific">{selectedSpecies.scientific_name}</div>
            </div>
          </div>
        )}

        {/* Vaihe 3: Lomakerivit */}
        {selectedSpecies && (
          <div className="ruled-card">
            <div className="ruled-row">
              <div className="ruled-label">Aika</div>
              <div className="ruled-value">
                <input
                  type="datetime-local"
                  value={seenAt}
                  onChange={(e) => setSeenAt(e.target.value)}
                />
              </div>
            </div>
            <div className="ruled-row">
              <div className="ruled-label">Paikka</div>
              <div className="ruled-value">
                {lat && lon ? (
                  <span className="text-value">
                    <span className="gps-dot" />
                    {Number(lat).toFixed(4)}, {Number(lon).toFixed(4)}
                    {locationLabel && ` · ${locationLabel}`}
                  </span>
                ) : (
                  <span style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-script)', fontSize: 18 }}>
                    Haetaan sijaintia...
                  </span>
                )}
              </div>
            </div>
            {teammates.length > 1 && (
              <div className="ruled-row">
                <div className="ruled-label">Havainnoija</div>
                <div className="ruled-value">
                  <select value={sightedFor} onChange={(e) => setSightedFor(e.target.value)}>
                    {teammates.map((t) => (
                      <option key={t.user_id} value={t.user_id}>
                        {t.display_name}{t.user_id === userId ? ' (sinä)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="ruled-row">
              <div className="ruled-label">Muistiinpanot</div>
              <div className="ruled-value">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="huomioita…"
                />
              </div>
            </div>
          </div>
        )}

        {/* Vaihe 4: Tallenna */}
        {selectedSpecies && (
          <button
            className="btn-save"
            onClick={onSubmit}
            disabled={submitting || !membership}
          >
            {submitting ? 'Tallennetaan...' : 'Tallenna päiväkirjaan'}
          </button>
        )}

        {!membership && selectedSpecies && (
          <div className="error-notification" style={{ marginTop: 8, borderRadius: 'var(--radius-md)' }}>
            Aktiivista joukkuejäsenyyttä ei löytynyt.
          </div>
        )}
      </div>
    </>
  );
}
