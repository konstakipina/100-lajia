// supabase/functions/profiles/index.ts
// GET ?scope=me → returns authenticated user's profile, role, team, and teammates

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

    // Fetch profile
    const { data: profile, error: profError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (profError) throw profError;

    // Fetch role (take highest: admin > player)
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roleList = (roles ?? []).map((r: any) => r.role);
    const role = roleList.includes("admin") ? "admin" : "player";

    // Fetch team membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, teams(*)")
      .eq("user_id", user.id)
      .single();

    const team = membership ? (membership as any).teams : null;

    // Fetch teammates (other members of the same team)
    let teammates: any[] = [];
    if (membership) {
      const { data: teamMates } = await supabase
        .from("team_members")
        .select("profiles:user_id(*)")
        .eq("team_id", membership.team_id)
        .neq("user_id", user.id);

      teammates = (teamMates ?? []).map((tm: any) => tm.profiles);
    }

    return new Response(
      JSON.stringify({ profile, role, team, teammates }),
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
