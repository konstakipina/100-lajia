// supabase/functions/species/index.ts
// Manages the master species list (Finnish birds).
// GET: list all (optional ?q= search), POST/PATCH/DELETE: admin only

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

    // Verify authentication
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

    // Helper: check admin role
    async function requireAdmin() {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .single();
      if (!data) {
        throw new Error("Forbidden");
      }
    }

    const url = new URL(req.url);

    switch (req.method) {
      case "GET": {
        const q = url.searchParams.get("q");
        let query = supabase
          .from("species")
          .select("*")
          .order("name_fi", { ascending: true });

        if (q) {
          query = query.or(
            `name_fi.ilike.%${q}%,name_sci.ilike.%${q}%`
          );
        }

        const { data, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "POST": {
        await requireAdmin();
        const body = await req.json();
        // TODO: validate body.name_fi and body.name_sci
        const { data, error } = await supabase
          .from("species")
          .insert({ name_fi: body.name_fi, name_sci: body.name_sci })
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
        // TODO: validate body.id exists
        const { data, error } = await supabase
          .from("species")
          .update({
            ...(body.name_fi && { name_fi: body.name_fi }),
            ...(body.name_sci && { name_sci: body.name_sci }),
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
          .from("species")
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
