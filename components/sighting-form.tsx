'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
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

function toLocalDatetimeValue(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function SightingForm({
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
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const searchSpecies = async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    const { data, error } = await supabase
      .from('species')
      .select('id, common_name, scientific_name, finnish_name, english_name, image_url')
      .or(
        `common_name.ilike.%${value}%,scientific_name.ilike.%${value}%,finnish_name.ilike.%${value}%,english_name.ilike.%${value}%`
      )
      .limit(10);

    if (!error) {
      setSuggestions((data as Species[]) ?? []);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported in this browser.');
      setMessageType('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
      },
      () => {
        setMessage('Could not fetch location. You can type it manually.');
        setMessageType('error');
      }
    );
  };

  const resetForm = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedSpecies(null);
    setSightedFor(userId);
    setSeenAt(toLocalDatetimeValue(new Date()));
    setLat('');
    setLon('');
    setLocationLabel('');
    setNotes('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (!membership) {
      setMessage('No active team membership found for an active competition.');
      setMessageType('error');
      return;
    }

    if (!selectedSpecies) {
      setMessage('Please choose a species from suggestions.');
      setMessageType('error');
      return;
    }

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
      notes: notes || null
    };

    const { error } = await supabase.from('sightings').insert(payload);

    setSubmitting(false);

    if (error) {
      // Parse DB trigger errors for friendlier messages
      const msg = error.message;
      if (msg.includes('not registered in competition')) {
        setMessage('Your team is not registered in the active competition.');
      } else if (msg.includes('not a member')) {
        setMessage('The selected user is not a member of your team in this competition.');
      } else if (msg.includes('outside the competition')) {
        setMessage('The sighting date is outside the competition date range.');
      } else {
        setMessage(`Save failed: ${msg}`);
      }
      setMessageType('error');
      return;
    }

    setMessage('Sighting saved! Leaderboards will update immediately.');
    setMessageType('success');
    resetForm();
  };

  return (
    <form className="card row" onSubmit={onSubmit}>
      <h1>New sighting</h1>

      <div>
        <label className="label">Species</label>
        <input className="input" value={query} onChange={(e) => searchSpecies(e.target.value)} placeholder="Type species name" autoFocus />
        {suggestions.length > 0 && (
          <div className="card" style={{ marginTop: 8, padding: 0 }}>
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="suggestion"
                onClick={() => {
                  setSelectedSpecies(s);
                  setQuery(s.finnish_name || s.common_name);
                  setSuggestions([]);
                }}
              >
                <strong>{s.finnish_name || s.common_name}</strong>
                <div className="small">{s.scientific_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSpecies && (
        <div className="card">
          <div><strong>Selected:</strong> {selectedSpecies.finnish_name || selectedSpecies.common_name}</div>
          <div className="small">{selectedSpecies.scientific_name}</div>
          {selectedSpecies.image_url ? (
            <Image src={selectedSpecies.image_url} alt={selectedSpecies.common_name} width={320} height={220} style={{ width: '100%', height: 'auto', marginTop: 8, borderRadius: 8 }} />
          ) : (
            <div className="small" style={{ marginTop: 8 }}>No image available.</div>
          )}
        </div>
      )}

      {teammates.length > 1 && (
        <div>
          <label className="label">Sighted by</label>
          <select className="input" value={sightedFor} onChange={(e) => setSightedFor(e.target.value)}>
            {teammates.map((t) => (
              <option key={t.user_id} value={t.user_id}>
                {t.display_name}{t.user_id === userId ? ' (you)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Seen at</label>
        <input className="input" type="datetime-local" value={seenAt} onChange={(e) => setSeenAt(e.target.value)} />
      </div>

      <div>
        <label className="label">Location (GPS)</label>
        <button className="btn btn-secondary" type="button" onClick={useCurrentLocation}>Use current location</button>
      </div>

      <div className="row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label className="label">Latitude</label>
          <input className="input" value={lat} onChange={(e) => setLat(e.target.value)} />
        </div>
        <div>
          <label className="label">Longitude</label>
          <input className="input" value={lon} onChange={(e) => setLon(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Location label</label>
        <input className="input" value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="Optional place name" />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {message && (
        <div className={`message ${messageType === 'success' ? 'message-success' : 'message-error'}`}>
          {message}
        </div>
      )}

      <div className="sticky-save">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save sighting'}
        </button>
      </div>
    </form>
  );
}
