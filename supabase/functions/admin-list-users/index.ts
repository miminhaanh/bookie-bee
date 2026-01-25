import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAIL = "bookieebee@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Verify the request is from admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing authorization" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Verify the user is admin
  const { data: authData, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (authError || !authData.user) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  if (authData.user.email !== ADMIN_EMAIL) {
    return new Response(
      JSON.stringify({ error: "Admin access required" }),
      { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Fetch all profiles using service role (bypasses RLS)
  const { data: profiles, error: profilesError, count } = await supabase
    .from("profiles")
    .select("user_id, display_name, created_at, is_admin, avatar_url", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(100);

  if (profilesError) {
    return new Response(
      JSON.stringify({ error: profilesError.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Get auth users info for email (service role can access this)
  const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  // Create a map of user_id to email
  const emailMap: Record<string, string> = {};
  if (authUsers?.users) {
    for (const u of authUsers.users) {
      emailMap[u.id] = u.email ?? "";
    }
  }

  // Merge profiles with emails
  const usersWithEmail = (profiles ?? []).map((p: any) => ({
    ...p,
    email: emailMap[p.user_id] ?? null,
  }));

  return new Response(
    JSON.stringify({ 
      users: usersWithEmail, 
      totalCount: count ?? profiles?.length ?? 0,
      authUsersCount: authUsers?.users?.length ?? 0
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
});
