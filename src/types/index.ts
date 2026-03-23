// ── Roles ──
export type AppRole = "player" | "admin";

// ── Profiles ──
export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

// ── Teams ──
export interface Team {
  id: string;
  name: string;
  initials: string;
  color_bg: string;
  color_fg: string;
  created_at: string;
}

export interface TeamWithMembers extends Team {
  members: Profile[];
  score: number; // unique species count across all members
}

// ── Species ──
export interface Species {
  id: string;
  name_fi: string;
  name_sci: string;
  created_at: string;
}

// ── Sightings ──
export interface Sighting {
  id: string;
  species_id: string;
  observer_id: string;
  logged_by: string;
  team_id: string;
  date: string; // YYYY-MM-DD
  location_name: string;
  location_lat: number | null;
  location_lon: number | null;
  is_new_for_user: boolean;
  created_at: string;
}

/** Sighting joined with species + observer info for display */
export interface SightingDisplay extends Sighting {
  species_name_fi: string;
  species_name_sci: string;
  observer_name: string;
  team_name: string;
}

// ── Standings ──
export interface TeamStanding {
  team: Team;
  member_count: number;
  score: number; // unique species across all team members
}

export interface IndividualStanding {
  profile: Profile;
  team: Team;
  score: number; // unique species for this user
}

export interface Standings {
  teams: TeamStanding[];
  individuals: IndividualStanding[];
}

// ── Auth context ──
export interface CurrentUser {
  profile: Profile;
  role: AppRole;
  team: Team | null;
  teammates: Profile[];
}
