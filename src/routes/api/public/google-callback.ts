import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/google-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { code?: string; redirectUri?: string };
          const { code, redirectUri } = body;

          if (!code) {
            return Response.json({ error: "Missing authorization code" }, { status: 400 });
          }

          const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
          const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

          if (!clientId) {
            return Response.json(
              { error: "Google Client ID is missing in environment" },
              { status: 500 },
            );
          }

          // Exchange authorization code for Google ID Token
          const params = new URLSearchParams({
            code,
            client_id: clientId,
            redirect_uri: redirectUri || "",
            grant_type: "authorization_code",
          });

          if (clientSecret) {
            params.append("client_secret", clientSecret);
          }

          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
          });

          const tokenData = (await tokenRes.json()) as {
            id_token?: string;
            access_token?: string;
            error?: string;
            error_description?: string;
          };

          if (!tokenRes.ok || !tokenData.id_token) {
            return Response.json(
              {
                error:
                  tokenData.error_description ||
                  tokenData.error ||
                  "Failed to exchange code with Google OAuth endpoint",
              },
              { status: 400 },
            );
          }

          return Response.json({
            id_token: tokenData.id_token,
            access_token: tokenData.access_token,
          });
        } catch (err: unknown) {
          const e = err as Error;
          return Response.json(
            { error: e.message || "Server-side OAuth callback processing failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
