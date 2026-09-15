import { createFileRoute } from "@tanstack/react-router";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/public/vision-scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return json({ ok: false, error: "AI vision engine is not configured." }, 500);
        }

        let payload: { image?: string; prompt?: string; text?: string };
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return json({ ok: false, error: "Invalid request body." }, 400);
        }

        const prompt = String(payload.prompt || payload.text || "").trim();
        if (!prompt) return json({ ok: false, error: "Missing prompt." }, 400);

        const image = typeof payload.image === "string" ? payload.image.trim() : "";
        if (image && !/^data:image\/(png|jpe?g|webp);base64,/i.test(image)) {
          return json(
            { ok: false, error: "Unsupported image. Upload a PNG, JPG or WEBP screenshot." },
            400,
          );
        }

        const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
        if (image) content.push({ type: "image_url", image_url: { url: image } });

        let res: Response;
        try {
          res = await fetch(GATEWAY, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": apiKey,
              "X-Lovable-AIG-SDK": "fetch",
            },
            body: JSON.stringify({
              model: MODEL,
              messages: [{ role: "user", content }],
            }),
          });
        } catch {
          return json({ ok: false, error: "Could not reach the AI vision engine." }, 502);
        }

        const raw = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(raw);
        } catch {
          /* non-JSON upstream body */
        }

        if (!res.ok) {
          const message =
            (data && (data.error?.message || data.message)) ||
            (res.status === 402
              ? "The AI vision engine is out of credits. Add credits to continue scanning."
              : res.status === 429
                ? "The AI vision engine is busy. Try again in a moment."
                : `AI vision engine error ${res.status}.`);
          return json({ ok: false, error: message }, res.status);
        }

        const choice = data?.choices?.[0] ?? {};
        let text = choice?.message?.content;
        if (Array.isArray(text)) {
          text = text
            .map((p: any) => (typeof p === "string" ? p : p?.text || p?.content || ""))
            .join("\n");
        }
        if (typeof text !== "string" || !text.trim()) {
          text =
            choice?.text ||
            choice?.message?.reasoning ||
            choice?.message?.reasoning_content ||
            data?.output_text ||
            "";
        }
        if (!String(text).trim()) {
          return json({ ok: false, error: "The AI vision engine returned an empty answer." }, 502);
        }

        return json({ ok: true, text: String(text) });
      },
    },
  },
});
