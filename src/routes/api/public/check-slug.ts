import { createFileRoute } from "@tanstack/react-router";
import { checkSlugAvailabilityOnServer } from "@/lib/slug-validator.server";

export const Route = createFileRoute("/api/public/check-slug")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug") || "";
        const userId = url.searchParams.get("userId") || null;

        const result = await checkSlugAvailabilityOnServer(slug, userId);
        return Response.json(result, {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        });
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { slug?: string; userId?: string | null };
          const result = await checkSlugAvailabilityOnServer(body.slug || "", body.userId || null);
          return Response.json(result, {
            headers: {
              "Cache-Control": "no-store, max-age=0",
            },
          });
        } catch {
          return Response.json({ error: "Invalid request payload" }, { status: 400 });
        }
      },
    },
  },
});
