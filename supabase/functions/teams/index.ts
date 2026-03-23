// supabase/functions/teams/index.ts
// Team management. GET returns teams with members and scores.
// POST/PATCH/DELETE: admin only.

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

    async function requireAdmin() {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .single();
      if (!data) throw new Error("Forbidden");
    }

    switch (req.method) {
      case "GET": {
        // Fetch teams with members
        const { data: teams, error } = await supabase
          .from("teams")
          .select(
            `
            *,
            team_members(
              user_id,
              profiles:user_id(id, email, display_name, avatar_url)
            )
          `
          )
          .order("name");

        if (error) throw error;

        // For each team, compute unique species count (team score)
        const result = await Promise.all(
          (teams ?? []).map(async (t: any) => {
            const { count } = await supabase
              .from("sightings")
              .select("species_id", { count: "exact", head: false })
              .eq("team_id", t.id)
              // TODO: this counts rows, not distinct species.
              // Replace with a DB view or RPC for COUNT(DISTINCT species_id).
              ;

            const members = (t.team_members ?? []).map(
              (tm: any) => tm.profiles
            );

            return {
              ...t,
              team_members: undefined,
              members,
              score: count ?? 0, // TODO: fix to distinct count
            };
          })
        );

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "POST": {
        await requireAdmin();
        const body = await req.json();
        const { data, error } = await supabase
          .from("teams")
          .insert({
            name: body.name,
            initials: body.initials,
            color_bg: body.color_bg,
            color_fg: body.color_fg,
          })
          .select()
          .single();
        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "PATCH": {
        await requireAdmin();
        const body = await req.json();
        // Handle member assignment
        if (body.action === "assign-member") {
          const { data, error } = await supabase
            .from("team_members")
            .upsert(
              { team_id: body.team_id, user_id: body.user_id },
              { onConflict: "user_id" }
            )
            .select()
            .single();
          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (body.action === "remove-member") {
          const { error } = await supabase
            .from("team_members")
            .delete()
            .eq("user_id", body.user_id);
          if (error) throw error;
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Regular team update
        const { data, error } = await supabase
          .from("teams")
          .update({
            ...(body.name && { name: body.name }),
            ...(body.initials && { initials: body.initials }),
            ...(body.color_bg && { color_bg: body.color_bg }),
            ...(body.color_fg && { color_fg: body.color_fg }),
          })
          .eq("id", body.id)
          .select()
          .single();
        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "DELETE": {
        await requireAdmin();
        const body = await req.json();
        const { error } = await supabase
          .from("teams")
          .delete()
          .eq("id", body.id);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), {
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
    const status = (err as Error).message === "Forbidden" ? 403 : 500;
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
