import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await supabaseUser
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const targetUserId = body?.user_id as string | undefined;

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Load profile for avatar cleanup
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", targetUserId)
      .limit(1);

    // Delete related data - order matters for foreign key constraints
    const tables = [
      // Child tables first (might have FK to books/profiles)
      "user_missions",
      "user_badges", 
      "user_achievements",
      "streak_days",
      "highlights",
      "reading_sessions",
      "daily_reading",
      "comments",
      // Parent tables
      "books",
      "profiles",
    ];

    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", targetUserId);
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
      } else {
        console.log(`Deleted from ${table} for user ${targetUserId}`);
      }
    }

    // Remove storage files
    const buckets = ["book-files", "book-covers"];
    for (const bucket of buckets) {
      try {
        const { data: files } = await supabaseAdmin.storage.from(bucket).list(targetUserId);
        if (files && files.length > 0) {
          const filePaths = files.map((f) => `${targetUserId}/${f.name}`);
          await supabaseAdmin.storage.from(bucket).remove(filePaths);
        }
      } catch (e) {
        console.error(`Storage error for bucket ${bucket}:`, e);
      }
    }

    // Avatars cleanup
    const avatarUrl = targetProfile?.[0]?.avatar_url ?? null;
    try {
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from("avatars")
        .list("avatars", { search: `${targetUserId}-` });

      if (avatarFiles && avatarFiles.length > 0) {
        const avatarPaths = avatarFiles.map((f) => `avatars/${f.name}`);
        await supabaseAdmin.storage.from("avatars").remove(avatarPaths);
      }
    } catch (e) {
      console.error("Storage error for bucket avatars:", e);
    }

    if (avatarUrl) {
      const match = String(avatarUrl).match(/avatars\/(.+)$/);
      if (match?.[1]) {
        await supabaseAdmin.storage.from("avatars").remove([`avatars/${match[1]}`]);
      }
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteUserError) {
      return new Response(JSON.stringify({ error: "Failed to delete auth user", details: deleteUserError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
