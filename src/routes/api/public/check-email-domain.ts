import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/check-email-domain")({
  server: {
    handlers: {
      GET: async () => {
        const apiKey = process.env["RESEND_API_KEY"];
        if (!apiKey) return Response.json({ error: "no key" }, { status: 500 });
        const res = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const body = await res.json();
        return Response.json(body, { status: res.status });
      },
    },
  },
});
