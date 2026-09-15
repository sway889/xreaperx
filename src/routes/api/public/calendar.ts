import { createFileRoute } from "@tanstack/react-router";

const FEEDS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
];

type FeedEvent = {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/public/calendar")({
  server: {
    handlers: {
      GET: async () => {
        type OutEvent = {
          title: string;
          country: string;
          date: string;
          impact: string;
          forecast: string;
          previous: string;
        };
        const events: OutEvent[] = [];

        for (const url of FEEDS) {
          try {
            const res = await fetch(url, { headers: { Accept: "application/json" } });
            if (!res.ok) continue;
            const list = (await res.json()) as FeedEvent[];
            if (!Array.isArray(list)) continue;
            for (const e of list) {
              const date = e.date ? new Date(e.date) : null;
              if (!e.title || !date || isNaN(date.getTime())) continue;
              events.push({
                title: String(e.title),
                country: String(e.country || "").toUpperCase(),
                date: date.toISOString(),
                impact: String(e.impact || "").toLowerCase(),
                forecast: String(e.forecast ?? ""),
                previous: String(e.previous ?? ""),
              });
            }
          } catch {
            /* try the next feed */
          }
        }

        if (!events.length) {
          return json({ ok: false, error: "Economic calendar feed unavailable." }, 502);
        }

        events.sort((a, b) => a.date.localeCompare(b.date));
        return json({ ok: true, fetchedAt: new Date().toISOString(), events });
      },
    },
  },
});
