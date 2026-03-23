"use client";

import { useState, useEffect, useMemo } from "react";
import * as api from "@/lib/api";
import type { TeamWithMembers, Profile } from "@/types";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New team form
  const [newName, setNewName] = useState("");
  const [newInitials, setNewInitials] = useState("");
  const [newColorBg, setNewColorBg] = useState("#FAEEDA");
  const [newColorFg, setNewColorFg] = useState("#BA7517");

  // Edit team
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editInitials, setEditInitials] = useState("");
  const [editColorBg, setEditColorBg] = useState("");
  const [editColorFg, setEditColorFg] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [t, p] = await Promise.all([api.listTeams(), api.listProfiles()]);
      setTeams(t);
      setProfiles(p);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Users not assigned to any team
  const assignedUserIds = useMemo(() => {
    const ids = new Set<string>();
    teams.forEach((t) => t.members.forEach((m) => ids.add(m.id)));
    return ids;
  }, [teams]);

  const unassignedProfiles = useMemo(
    () => profiles.filter((p) => !assignedUserIds.has(p.id)),
    [profiles, assignedUserIds]
  );

  async function handleCreateTeam() {
    if (!newName.trim() || !newInitials.trim()) return;
    try {
      setSaving(true);
      await api.createTeam({
        name: newName.trim(),
        initials: newInitials.trim().toUpperCase().slice(0, 2),
        color_bg: newColorBg,
        color_fg: newColorFg,
      });
      setNewName("");
      setNewInitials("");
      setNewColorBg("#FAEEDA");
      setNewColorFg("#BA7517");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTeam(id: string) {
    if (!editName.trim() || !editInitials.trim()) return;
    try {
      setSaving(true);
      await api.updateTeam(id, {
        name: editName.trim(),
        initials: editInitials.trim().toUpperCase().slice(0, 2),
        color_bg: editColorBg,
        color_fg: editColorFg,
      });
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTeam(id: string) {
    if (!confirm("Poistetaanko joukkue?")) return;
    try {
      await api.deleteTeam(id);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAssign(teamId: string, userId: string) {
    try {
      setSaving(true);
      await api.assignMember(teamId, userId);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      setSaving(true);
      await api.removeMember(userId);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(t: TeamWithMembers) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditInitials(t.initials);
    setEditColorBg(t.color_bg);
    setEditColorFg(t.color_fg);
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

  const colorInputStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    padding: "2px",
    border: "0.5px solid var(--border)",
    borderRadius: "10px",
    background: "var(--card)",
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
        Joukkueet
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

      {/* Create team form */}
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
          Uusi joukkue
        </div>
        <input
          style={inputStyle}
          placeholder="Joukkueen nimi"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder="Lyhenne (2 kirjainta)"
          value={newInitials}
          maxLength={2}
          onChange={(e) => setNewInitials(e.target.value)}
        />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <label style={{ fontSize: "11px", color: "var(--inkm)" }}>Taustaväri</label>
          <input
            type="color"
            style={colorInputStyle}
            value={newColorBg}
            onChange={(e) => setNewColorBg(e.target.value)}
          />
          <label style={{ fontSize: "11px", color: "var(--inkm)" }}>Tekstiväri</label>
          <input
            type="color"
            style={colorInputStyle}
            value={newColorFg}
            onChange={(e) => setNewColorFg(e.target.value)}
          />
        </div>
        <button style={btnStyle} onClick={handleCreateTeam} disabled={saving}>
          {saving ? "Tallennetaan..." : "Luo joukkue"}
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: "14px", color: "var(--inkl)", padding: "16px 0", textAlign: "center" }}>
          Ladataan...
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: ".07em",
              textTransform: "uppercase",
              color: "var(--inkl)",
            }}
          >
            {teams.length} joukkuetta
          </div>

          {teams.map((t) => (
            <div
              key={t.id}
              style={{
                background: "var(--card)",
                border: "0.5px solid var(--border)",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {/* Team header */}
              <div
                style={{
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  borderBottom: "0.5px solid var(--bf)",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: t.color_bg,
                    color: t.color_fg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {t.initials}
                </div>

                {editingId === t.id ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <input style={inputStyle} value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <input style={inputStyle} value={editInitials} maxLength={2} onChange={(e) => setEditInitials(e.target.value)} />
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input type="color" style={colorInputStyle} value={editColorBg} onChange={(e) => setEditColorBg(e.target.value)} />
                      <input type="color" style={colorInputStyle} value={editColorFg} onChange={(e) => setEditColorFg(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button style={smallBtnStyle} onClick={() => handleUpdateTeam(t.id)} disabled={saving}>Tallenna</button>
                      <button style={smallBtnStyle} onClick={() => setEditingId(null)}>Peruuta</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{t.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--inkm)" }}>
                        {t.members.length} jäsentä · {t.score} lajia
                      </div>
                    </div>
                    <button style={smallBtnStyle} onClick={() => startEdit(t)}>Muokkaa</button>
                    <button style={smallBtnStyle} onClick={() => handleDeleteTeam(t.id)}>Poista</button>
                  </>
                )}
              </div>

              {/* Members */}
              <div style={{ padding: "10px 14px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--inkl)", marginBottom: "6px" }}>
                  Jäsenet
                </div>
                {t.members.length === 0 && (
                  <div style={{ fontSize: "12px", color: "var(--inkl)" }}>Ei jäseniä</div>
                )}
                {t.members.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "4px 0",
                      gap: "8px",
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "var(--ink)", flex: 1 }}>
                      {m.display_name}
                    </div>
                    <button
                      style={smallBtnStyle}
                      onClick={() => handleRemoveMember(m.id)}
                    >
                      Poista
                    </button>
                  </div>
                ))}

                {/* Assign user */}
                {unassignedProfiles.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <select
                      style={{
                        ...inputStyle,
                        width: "100%",
                        flex: undefined,
                      }}
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssign(t.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="" disabled>
                        Lisää jäsen...
                      </option>
                      {unassignedProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
