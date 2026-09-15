import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reaper AI Scanner — License-Protected EA Platform" },
      {
        name: "description",
        content:
          "Mentors brand and license their own Expert Advisor. Clients connect a broker account, scan charts with AI and trade with a license key.",
      },
      { property: "og:title", content: "Reaper AI Scanner" },
      {
        property: "og:description",
        content:
          "License-protected EA platform for mentors and their clients: AI chart scans, broker connections and license keys.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/reaper-app.html"
      title="Reaper AI Scanner"
      className="h-screen w-screen border-0"
    />
  );
}
