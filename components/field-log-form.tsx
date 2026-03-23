'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  const supabase = useMemo(() => createClient(), []);
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
      const { data } = await supabase
        .from('species')
        .select('id, common_name, scientific_name, finnish_name, english_name, image_url')
        .or(`finnish_name.ilike.%${value}%,common_name.ilike.%${value}%,scientific_name.ilike.%${value}%`)
        .limit(5);
      if (data) setSuggestions(data as Species[]);
    }, 200);
  }, [supabase]);

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

    const { data, error } = await supabase.from('sightings').insert(payload).select('is_new_for_user_year, is_new_for_team_year').single();
    setSubmitting(false);

    if (error) {
      const msg = error.message;
      if (msg.includes('not registered in competition')) {
        setNotification({ type: 'error', text: 'Your team is not registered in the active competition.' });
      } else if (msg.includes('not a member')) {
        setNotification({ type: 'error', text: 'Selected user is not a member of your team.' });
      } else if (msg.includes('outside')) {
        setNotification({ type: 'error', text: 'Sighting date is outside competition range.' });
      } else {
        setNotification({ type: 'error', text: `Save failed: ${msg}` });
      }
      return;
    }

    const isNew = data?.is_new_for_user_year || data?.is_new_for_team_year;
    setNotification({
      type: 'success',
      text: isNew ? 'Uusi laji!' : 'Tallennettu',
      species: selectedSpecies.finnish_name || selectedSpecies.common_name,
      isNew,
    });
    resetForm();
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
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
        {/* Step 1: Search */}
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

        {/* Step 2: Species card */}
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

        {/* Step 3: Ruled form rows */}
        {selectedSpecies && (
          <div className="ruled-card">
            <div className="ruled-row">
              <div className="ruled-label">Time</div>
              <div className="ruled-value">
                <input
                  type="datetime-local"
                  value={seenAt}
                  onChange={(e) => setSeenAt(e.target.value)}
                />
              </div>
            </div>
            <div className="ruled-row">
              <div className="ruled-label">Location</div>
              <div className="ruled-value">
                {lat && lon ? (
                  <span className="text-value">
                    <span className="gps-dot" />
                    {Number(lat).toFixed(4)}, {Number(lon).toFixed(4)}
                    {locationLabel && ` · ${locationLabel}`}
                  </span>
                ) : (
                  <span style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-script)', fontSize: 18 }}>
                    Fetching GPS...
                  </span>
                )}
              </div>
            </div>
            {teammates.length > 1 && (
              <div className="ruled-row">
                <div className="ruled-label">Observer</div>
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
              <div className="ruled-label">Notes</div>
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

        {/* Step 4: Save */}
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
            No active team membership found.
          </div>
        )}
      </div>
    </>
  );
}
