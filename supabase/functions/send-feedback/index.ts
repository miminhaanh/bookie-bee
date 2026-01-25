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

type FeedbackPayload = {
  type?: string;
  content?: string;
  from_email?: string | null;
};

Deno.serve(async (req) => {
  const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "bookieebee@gmail.com";
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing RESEND_API_KEY" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const payload = (await req.json().catch(() => ({}))) as FeedbackPayload & { message?: string; email?: string | null };
  const type = payload.type ?? "general";
  const content = payload.content ?? payload.message ?? "";
  let fromEmail = payload.from_email ?? payload.email ?? "unknown";

  const authHeader = req.headers.get("Authorization");
  if (
    authHeader?.startsWith("Bearer ") &&
    SUPABASE_URL &&
    SUPABASE_SERVICE_ROLE_KEY
  ) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (data?.user?.email) fromEmail = data.user.email;
    } catch {
      // ignore auth lookup failures (anonymous support)
    }
  }

  if (!content.trim()) {
    return new Response(JSON.stringify({ error: "Content is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const subject = `[Bookie Bee] Feedback (${type})`;
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Phản hồi mới từ Bookie Bee</h2>
      <p><strong>Loại:</strong> ${type}</p>
      <p><strong>Email:</strong> ${fromEmail}</p>
      <p><strong>Nội dung:</strong></p>
      <div style="white-space: pre-wrap; padding: 12px; background: #f7f7f7; border-radius: 8px;">${content}</div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Bookie Bee <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let errJson: unknown = null;
    try {
      errJson = errText ? JSON.parse(errText) : null;
    } catch {
      // ignore JSON parse error
    }
    return new Response(
      JSON.stringify({
        error: "Resend API error",
        status: res.status,
        details: errJson ?? errText ?? "Unknown error",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
