import { getAccessToken } from "./auth";
import type {
  Species,
  SightingDisplay,
  TeamWithMembers,
  Standings,
  CurrentUser,
  Profile,
  Team,
} from "@/types";

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL!;

/**
 * Generic Edge Function caller with auth header.
 */
async function callFunction<T>(
  fnName: string,
  options: {
    method?: string;
    params?: Record<string, string>;
    body?: unknown;
  } = {}
): Promise<T> {
  const { method = "GET", params, body } = options;
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const url = new URL(`${FUNCTIONS_URL}/${fnName}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge Function ${fnName} error ${res.status}: ${text}`);
  }

  return res.json();
}

// ── Species ──

export async function listSpecies(search?: string): Promise<Species[]> {
  const params: Record<string, string> = {};
  if (search) params.q = search;
  return callFunction<Species[]>("species", { params });
}

export async function createSpecies(
  data: Pick<Species, "name_fi" | "name_sci">
): Promise<Species> {
  return callFunction<Species>("species", { method: "POST", body: data });
}

export async function updateSpecies(
  id: string,
  data: Partial<Pick<Species, "name_fi" | "name_sci">>
): Promise<Species> {
  return callFunction<Species>("species", {
    method: "PATCH",
    body: { id, ...data },
  });
}

export async function deleteSpecies(id: string): Promise<void> {
  await callFunction("species", { method: "DELETE", body: { id } });
}

// ── Sightings ──

export async function listSightings(filters?: {
  user_id?: string;
  team_id?: string;
  observer_id?: string;
}): Promise<SightingDisplay[]> {
  const params: Record<string, string> = {};
  if (filters?.user_id) params.user_id = filters.user_id;
  if (filters?.team_id) params.team_id = filters.team_id;
  if (filters?.observer_id) params.observer_id = filters.observer_id;
  return callFunction<SightingDisplay[]>("sightings", { params });
}

export async function createSighting(data: {
  species_id: string;
  observer_id: string;
  date: string;
  location_name: string;
  location_lat?: number | null;
  location_lon?: number | null;
}): Promise<SightingDisplay> {
  return callFunction<SightingDisplay>("sightings", {
    method: "POST",
    body: data,
  });
}

// ── Teams ──

export async function listTeams(): Promise<TeamWithMembers[]> {
  return callFunction<TeamWithMembers[]>("teams");
}

export async function createTeam(data: {
  name: string;
  initials: string;
  color_bg: string;
  color_fg: string;
}): Promise<Team> {
  return callFunction<Team>("teams", { method: "POST", body: data });
}

export async function updateTeam(
  id: string,
  data: Partial<Pick<Team, "name" | "initials" | "color_bg" | "color_fg">>
): Promise<Team> {
  return callFunction<Team>("teams", { method: "PATCH", body: { id, ...data } });
}

export async function deleteTeam(id: string): Promise<void> {
  await callFunction("teams", { method: "DELETE", body: { id } });
}

export async function assignMember(
  team_id: string,
  user_id: string
): Promise<void> {
  await callFunction("teams", {
    method: "PATCH",
    body: { action: "assign-member", team_id, user_id },
  });
}

export async function removeMember(user_id: string): Promise<void> {
  await callFunction("teams", {
    method: "PATCH",
    body: { action: "remove-member", user_id },
  });
}

// ── Standings ──

export async function getStandings(): Promise<Standings> {
  return callFunction<Standings>("standings");
}

// ── Profiles ──

export async function getMe(): Promise<CurrentUser> {
  return callFunction<CurrentUser>("profiles", { params: { scope: "me" } });
}

export async function listProfiles(): Promise<Profile[]> {
  return callFunction<Profile[]>("profiles", { params: { scope: "all" } });
}
