// supabase/functions/standings/index.ts
// Returns sorted team and individual leaderboards.
// Team score = COUNT(DISTINCT species_id) per team
// Individual score = COUNT(DISTINCT species_id) per user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TODO: Replace these with Postgres RPC functions for proper
    // COUNT(DISTINCT species_id) — Supabase JS client doesn't support
    // distinct aggregation natively. For now, fetch and compute in-memory.

    // ── Team standings ──
    const { data: teams } = await supabase
      .from("teams")
      .select("*");

    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("team_id, user_id");

    const { data: allSightings } = await supabase
      .from("sightings")
      .select("species_id, observer_id, team_id");

    const memberCountByTeam: Record<string, number> = {};
    (teamMembers ?? []).forEach((tm: any) => {
      memberCountByTeam[tm.team_id] =
        (memberCountByTeam[tm.team_id] ?? 0) + 1;
    });

    // Team score: unique species across all team sightings
    const teamSpecies: Record<string, Set<string>> = {};
    (allSightings ?? []).forEach((s: any) => {
      if (!teamSpecies[s.team_id]) teamSpecies[s.team_id] = new Set();
      teamSpecies[s.team_id].add(s.species_id);
    });

    const teamStandings = (teams ?? [])
      .map((t: any) => ({
        team: t,
        member_count: memberCountByTeam[t.id] ?? 0,
        score: teamSpecies[t.id]?.size ?? 0,
      }))
      .sort((a: any, b: any) => b.score - a.score);

    // ── Individual standings ──
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*");

    // Individual score: unique species per observer
    const userSpecies: Record<string, Set<string>> = {};
    (allSightings ?? []).forEach((s: any) => {
      if (!userSpecies[s.observer_id])
        userSpecies[s.observer_id] = new Set();
      userSpecies[s.observer_id].add(s.species_id);
    });

    // Map user to team
    const userTeamMap: Record<string, string> = {};
    (teamMembers ?? []).forEach((tm: any) => {
      userTeamMap[tm.user_id] = tm.team_id;
    });

    const teamById: Record<string, any> = {};
    (teams ?? []).forEach((t: any) => {
      teamById[t.id] = t;
    });

    const individualStandings = (profiles ?? [])
      .filter((p: any) => userTeamMap[p.id]) // only players assigned to teams
      .map((p: any) => ({
        profile: p,
        team: teamById[userTeamMap[p.id]] ?? null,
        score: userSpecies[p.id]?.size ?? 0,
      }))
      .sort((a: any, b: any) => b.score - a.score);

    return new Response(
      JSON.stringify({
        teams: teamStandings,
        individuals: individualStandings,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
