declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TranslateRequest = {
  q: string;
  target?: string;
};

type TranslateRequestBody = Partial<TranslateRequest> & {
  // Debug helper: returns available models for this API key without exposing the key.
  action?: "listModels";
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
};

type GeminiListModelsResponse = {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
    displayName?: string;
  }>;
  error?: { message?: string };
};

type GeminiResolvedModel = {
  apiVersion: "v1beta" | "v1";
  modelId: string;
};

let cachedModel: GeminiResolvedModel | null = null;
let cachedModelAtMs = 0;

const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

const normalizeModelId = (name: string) => {
  const n = name.trim();
  return n.startsWith("models/") ? n.slice("models/".length) : n;
};

const pickBestModel = (models: GeminiListModelsResponse["models"]) => {
  const candidates = (models ?? [])
    .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((m) => normalizeModelId(m.name ?? ""))
    .filter(Boolean);

  if (candidates.length === 0) return null;

  // Prefer flash, then pro, then anything else.
  const score = (id: string) => {
    const s = id.toLowerCase();
    let v = 0;
    if (s.includes("flash")) v += 100;
    if (s.includes("pro")) v += 50;
    // Prefer newer-looking versions if present.
    if (s.includes("2.0")) v += 20;
    if (s.includes("1.5")) v += 10;
    if (s.includes("latest")) v += 5;
    return v;
  };

  return [...candidates].sort((a, b) => score(b) - score(a))[0] ?? null;
};

const listModels = async (opts: { apiKey: string; apiVersion: "v1beta" | "v1" }) => {
  const url = `https://generativelanguage.googleapis.com/${opts.apiVersion}/models?key=${encodeURIComponent(
    opts.apiKey,
  )}`;
  const res = await fetch(url, { method: "GET" });
  const raw = (await res.json().catch(() => ({}))) as GeminiListModelsResponse;
  return { res, raw };
};

const shouldRetryWithFallback = (message: string) => {
  const m = message.toLowerCase();
  return (
    m.includes("is not found") ||
    m.includes("not found") ||
    m.includes("not supported") ||
    m.includes("listmodels")
  );
};

const callGeminiGenerateContent = async (opts: {
  apiKey: string;
  apiVersion: "v1beta" | "v1";
  model: string;
  prompt: string;
}) => {
  const url = `https://generativelanguage.googleapis.com/${opts.apiVersion}/models/${encodeURIComponent(
    opts.model,
  )}:generateContent?key=${encodeURIComponent(opts.apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    }),
  });

  const raw = (await res.json().catch(() => ({}))) as GeminiGenerateResponse;
  return { res, raw };
};

const resolveModel = async (apiKey: string, configuredModel: string): Promise<GeminiResolvedModel> => {
  const now = Date.now();
  if (cachedModel && now - cachedModelAtMs < MODEL_CACHE_TTL_MS) {
    return cachedModel;
  }

  for (const apiVersion of ["v1beta", "v1"] as const) {
    const { res, raw } = await listModels({ apiKey, apiVersion });
    if (!res.ok) continue;
    const best = pickBestModel(raw.models);
    if (best) {
      cachedModel = { apiVersion, modelId: best };
      cachedModelAtMs = now;
      return cachedModel;
    }
  }

  // Last resort: common default (may still fail, but gives a clearer error downstream)
  return { apiVersion: "v1beta", modelId: "gemini-1.5-flash-latest" };
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const configuredModel = (Deno.env.get("GEMINI_MODEL") ?? "").trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY secret" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as TranslateRequestBody | null;

    // Optional: list available models for this API key.
    if (body?.action === "listModels") {
      const out: Record<string, unknown> = {};

      for (const apiVersion of ["v1beta", "v1"] as const) {
        const { res, raw } = await listModels({ apiKey, apiVersion });
        const ids = (raw.models ?? [])
          .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
          .map((m) => normalizeModelId(m.name ?? ""))
          .filter(Boolean);

        out[apiVersion] = {
          ok: res.ok,
          status: res.status,
          count: ids.length,
          models: ids.slice(0, 50),
          error: raw?.error?.message,
        };
      }

      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const q = (body?.q ?? "").trim();
    const target = (body?.target ?? "vi").trim() || "vi";

    if (!q) {
      return new Response(JSON.stringify({ error: "Missing 'q'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent accidental huge payloads; adjust if needed.
    if (q.length > 6000) {
      return new Response(JSON.stringify({ error: "Text too long" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt =
      `Translate the following text into ${target}. ` +
      `Return ONLY the translated text (no quotes, no explanation).\n\n` +
      q;

    const resolved = await resolveModel(apiKey, "");

    const modelCandidates = (
      configuredModel
        ? [
            normalizeModelId(configuredModel),
            resolved.modelId,
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
          ]
        : [
            resolved.modelId,
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
          ]
    )
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    let lastError = "";
    let translatedText = "";

    for (const model of modelCandidates) {
      // Try resolved API version first, then fallback.
      const apiOrder = resolved.apiVersion === "v1" ? (["v1", "v1beta"] as const) : (["v1beta", "v1"] as const);
      for (const apiVersion of apiOrder) {
        const { res, raw } = await callGeminiGenerateContent({
          apiKey,
          apiVersion,
          model,
          prompt,
        });

        if (res.ok) {
          translatedText =
            raw?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("")?.trim() ?? "";
          break;
        }

        const message = raw?.error?.message ?? `Gemini error: ${res.status}`;
        lastError = message;
        if (!shouldRetryWithFallback(message)) {
          return new Response(JSON.stringify({ error: message }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      if (translatedText) break;
    }

    if (!translatedText) {
      const hint =
        "Không tìm được model Gemini hợp lệ cho API key này. " +
        "Bạn có thể gọi debug bằng POST {\"action\":\"listModels\"} tới /functions/v1/translate để xem models khả dụng, " +
        "sau đó set secret GEMINI_MODEL theo một model trong danh sách.";
      const message = lastError ? `${lastError} | ${hint}` : hint;
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!translatedText) {
      return new Response(JSON.stringify({ error: "Empty translation" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ translatedText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
