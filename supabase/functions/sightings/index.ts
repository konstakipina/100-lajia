// supabase/functions/sightings/index.ts
// Log and retrieve bird sightings.
// GET: list (filterable by user_id, team_id, observer_id)
// POST: create (computes is_new_for_user, validates team membership)

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

    const url = new URL(req.url);

    switch (req.method) {
      case "GET": {
        // Build query with joins for display fields
        // TODO: replace with a database view for cleaner joins
        let query = supabase
          .from("sightings")
          .select(
            `
            *,
            species:species_id(name_fi, name_sci),
            observer:observer_id(display_name),
            team:team_id(name)
          `
          )
          .order("created_at", { ascending: false });

        const userId = url.searchParams.get("user_id");
        const teamId = url.searchParams.get("team_id");
        const observerId = url.searchParams.get("observer_id");

        if (userId) query = query.eq("logged_by", userId);
        if (teamId) query = query.eq("team_id", teamId);
        if (observerId) query = query.eq("observer_id", observerId);

        const { data, error } = await query;
        if (error) throw error;

        // Flatten joined data into SightingDisplay shape
        const result = (data ?? []).map((s: any) => ({
          ...s,
          species_name_fi: s.species?.name_fi ?? "",
          species_name_sci: s.species?.name_sci ?? "",
          observer_name: s.observer?.display_name ?? "",
          team_name: s.team?.name ?? "",
          species: undefined,
          observer: undefined,
          team: undefined,
        }));

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "POST": {
        const body = await req.json();

        // Validate: logged_by must be the authenticated user
        const loggedBy = user.id;

        // Validate: observer must be on the same team as logged_by
        const { data: loggerTeam } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", loggedBy)
          .single();

        if (!loggerTeam) {
          return new Response(
            JSON.stringify({ error: "You are not assigned to a team" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data: observerTeam } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", body.observer_id)
          .single();

        if (!observerTeam || observerTeam.team_id !== loggerTeam.team_id) {
          return new Response(
            JSON.stringify({ error: "Observer must be on your team" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Compute is_new_for_user: does observer already have this species?
        const { data: existing } = await supabase
          .from("sightings")
          .select("id")
          .eq("observer_id", body.observer_id)
          .eq("species_id", body.species_id)
          .limit(1);

        const isNew = !existing || existing.length === 0;

        // Insert sighting
        const { data: sighting, error: insertError } = await supabase
          .from("sightings")
          .insert({
            species_id: body.species_id,
            observer_id: body.observer_id,
            logged_by: loggedBy,
            team_id: loggerTeam.team_id,
            date: body.date,
            location_name: body.location_name ?? "",
            location_lat: body.location_lat ?? null,
            location_lon: body.location_lon ?? null,
            is_new_for_user: isNew,
          })
          .select(
            `
            *,
            species:species_id(name_fi, name_sci),
            observer:observer_id(display_name),
            team:team_id(name)
          `
          )
          .single();

        if (insertError) throw insertError;

        const result = {
          ...sighting,
          species_name_fi: (sighting as any).species?.name_fi ?? "",
          species_name_sci: (sighting as any).species?.name_sci ?? "",
          observer_name: (sighting as any).observer?.display_name ?? "",
          team_name: (sighting as any).team?.name ?? "",
          species: undefined,
          observer: undefined,
          team: undefined,
        };

        return new Response(JSON.stringify(result), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response("Method not allowed", {
          status: 405,
          headers: corsHeaders,
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
