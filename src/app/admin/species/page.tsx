"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import type { Species } from "@/types";

export default function AdminSpeciesPage() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNameFi, setNewNameFi] = useState("");
  const [newNameSci, setNewNameSci] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameFi, setEditNameFi] = useState("");
  const [editNameSci, setEditNameSci] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadSpecies() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listSpecies();
      data.sort((a, b) => a.name_fi.localeCompare(b.name_fi, "fi"));
      setSpecies(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSpecies();
  }, []);

  async function handleAdd() {
    if (!newNameFi.trim() || !newNameSci.trim()) return;
    try {
      setSaving(true);
      const created = await api.createSpecies({
        name_fi: newNameFi.trim(),
        name_sci: newNameSci.trim(),
      });
      setSpecies((prev) =>
        [...prev, created].sort((a, b) => a.name_fi.localeCompare(b.name_fi, "fi"))
      );
      setNewNameFi("");
      setNewNameSci("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editNameFi.trim() || !editNameSci.trim()) return;
    try {
      setSaving(true);
      const updated = await api.updateSpecies(id, {
        name_fi: editNameFi.trim(),
        name_sci: editNameSci.trim(),
      });
      setSpecies((prev) =>
        prev
          .map((s) => (s.id === id ? updated : s))
          .sort((a, b) => a.name_fi.localeCompare(b.name_fi, "fi"))
      );
      setEditingId(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Poistetaanko laji?")) return;
    try {
      await api.deleteSpecies(id);
      setSpecies((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function startEdit(s: Species) {
    setEditingId(s.id);
    setEditNameFi(s.name_fi);
    setEditNameSci(s.name_sci);
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: "system-ui, sans-serif",
    fontSize: "13px",
    padding: "8px 10px",
    border: "0.5px solid var(--border)",
    borderRadius: "10px",
    background: "var(--card)",
    color: "var(--ink)",
    outline: "none",
    flex: 1,
  };

  const btnStyle: React.CSSProperties = {
    fontFamily: "system-ui, sans-serif",
    fontSize: "13px",
    fontWeight: 600,
    padding: "8px 14px",
    border: "none",
    borderRadius: "10px",
    background: "var(--ink)",
    color: "var(--p)",
    cursor: "pointer",
  };

  const smallBtnStyle: React.CSSProperties = {
    fontFamily: "system-ui, sans-serif",
    fontSize: "11px",
    padding: "4px 10px",
    border: "0.5px solid var(--border)",
    borderRadius: "10px",
    background: "var(--card)",
    color: "var(--inkm)",
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px", flex: 1 }}>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: "26px",
          color: "var(--ink)",
        }}
      >
        Lajilista
      </div>

      {error && (
        <div
          style={{
            background: "var(--card)",
            border: "0.5px solid var(--border)",
            borderRadius: "10px",
            padding: "14px",
            color: "#993C1D",
            fontSize: "13px",
          }}
        >
          {error}
          <span
            onClick={() => setError(null)}
            style={{ marginLeft: "8px", cursor: "pointer", textDecoration: "underline" }}
          >
            Sulje
          </span>
        </div>
      )}

      {/* Add form */}
      <div
        style={{
          background: "var(--card)",
          border: "0.5px solid var(--border)",
          borderRadius: "10px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--inkl)" }}>
          Lisää uusi laji
        </div>
        <input
          style={inputStyle}
          placeholder="Suomenkielinen nimi"
          value={newNameFi}
          onChange={(e) => setNewNameFi(e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder="Tieteellinen nimi"
          value={newNameSci}
          onChange={(e) => setNewNameSci(e.target.value)}
        />
        <button style={btnStyle} onClick={handleAdd} disabled={saving}>
          {saving ? "Tallennetaan..." : "Lisää"}
        </button>
      </div>

      {/* Species count */}
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: ".07em",
          textTransform: "uppercase",
          color: "var(--inkl)",
        }}
      >
        {species.length} lajia
      </div>

      {loading ? (
        <div style={{ fontSize: "14px", color: "var(--inkl)", padding: "16px 0", textAlign: "center" }}>
          Ladataan...
        </div>
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "0.5px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {species.map((s, i) => (
            <div
              key={s.id}
              style={{
                padding: "10px 14px",
                borderBottom: i < species.length - 1 ? "0.5px solid var(--bf)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {editingId === s.id ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <input
                    style={inputStyle}
                    value={editNameFi}
                    onChange={(e) => setEditNameFi(e.target.value)}
                  />
                  <input
                    style={inputStyle}
                    value={editNameSci}
                    onChange={(e) => setEditNameSci(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      style={smallBtnStyle}
                      onClick={() => handleUpdate(s.id)}
                      disabled={saving}
                    >
                      Tallenna
                    </button>
                    <button
                      style={smallBtnStyle}
                      onClick={() => setEditingId(null)}
                    >
                      Peruuta
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", color: "var(--ink)" }}>
                      {s.name_fi}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontStyle: "italic",
                        fontSize: "12px",
                        color: "var(--inkm)",
                        marginTop: "1px",
                      }}
                    >
                      {s.name_sci}
                    </div>
                  </div>
                  <button style={smallBtnStyle} onClick={() => startEdit(s)}>
                    Muokkaa
                  </button>
                  <button style={smallBtnStyle} onClick={() => handleDelete(s.id)}>
                    Poista
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
