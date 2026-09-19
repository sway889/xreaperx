import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function client() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

type Entry = { key: string; value: unknown };

const KEY_RE = /^(raMentors|raClients|raEAs|raKeys|raMt|raSeeded|raHistory_|raRunning_|raNotifSeen_|raScanHistory_|raScanUsage_)/;

export const Route = createFileRoute("/api/public/state")({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await client().from("app_state").select("key, value");
        if (error) return json({ ok: false, error: error.message }, 500);
        const state: Record<string, unknown> = {};
        for (const row of data ?? []) state[row.key] = row.value;
        return json({ ok: true, state });
      },
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Invalid JSON body" }, 400);
        }
        const raw = body as { key?: unknown; value?: unknown; entries?: unknown };
        const list: Entry[] = Array.isArray(raw.entries)
          ? (raw.entries as Entry[])
          : typeof raw.key === "string"
            ? [{ key: raw.key, value: raw.value }]
            : [];

        const rows = list
          .filter((e) => e && typeof e.key === "string" && KEY_RE.test(e.key) && e.value !== undefined)
          .map((e) => ({ key: e.key, value: e.value as never, updated_at: new Date().toISOString() }));

        if (!rows.length) return json({ ok: false, error: "Nothing to save" }, 400);

        const { error } = await client().from("app_state").upsert(rows, { onConflict: "key" });
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true, saved: rows.length });
      },
    },
  },
});
