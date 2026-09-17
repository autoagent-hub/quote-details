import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/google-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            code?: string;
            redirectUri?: string;
            credential?: string;
          };
          const { code, redirectUri, credential } = body;

          let idToken = credential;
          let accessToken: string | undefined;

          const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
          const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

          // 1. If code was provided, exchange it for ID token
          if (!idToken && code) {
            if (!clientId) {
              return Response.json(
                { error: "Google Client ID is missing in environment" },
                { status: 500 },
              );
            }

            const params = new URLSearchParams({
              code,
              client_id: clientId,
              redirect_uri: redirectUri || "postmessage",
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

            idToken = tokenData.id_token;
            accessToken = tokenData.access_token;
          }

          if (!idToken) {
            return Response.json(
              { error: "Missing authorization code or credential token" },
              { status: 400 },
            );
          }

          // 2. Verify ID token with Google tokeninfo endpoint
          let tokenEmail: string | undefined;
          let tokenName: string | undefined;
          let tokenPicture: string | undefined;
          let tokenSub: string | undefined;

          try {
            const infoRes = await fetch(
              `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
            );
            if (infoRes.ok) {
              const info = (await infoRes.json()) as {
                email?: string;
                name?: string;
                picture?: string;
                sub?: string;
              };
              tokenEmail = info.email?.toLowerCase().trim();
              tokenName = info.name;
              tokenPicture = info.picture;
              tokenSub = info.sub;
            }
          } catch (verifyErr) {
            console.warn("[google-callback] tokeninfo verification warning:", verifyErr);
          }

          // 3. If service role key is available, ensure user exists and generate token_hash for instant login
          let tokenHash: string | undefined;
          const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
          const serviceKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;

          if (supabaseUrl && serviceKey && tokenEmail) {
            try {
              const admin = createClient(supabaseUrl, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false },
              });

              // Check if user exists
              const { data: userList } = await admin.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
              });
              let existingUser = userList?.users?.find(
                (u) => u.email?.toLowerCase().trim() === tokenEmail,
              );

              if (!existingUser) {
                const { data: newUser, error: createError } = await admin.auth.admin.createUser({
                  email: tokenEmail,
                  email_confirm: true,
                  user_metadata: {
                    full_name: tokenName || "",
                    name: tokenName || "",
                    avatar_url: tokenPicture || "",
                    picture: tokenPicture || "",
                    iss: "https://accounts.google.com",
                    sub: tokenSub,
                  },
                });
                if (!createError && newUser?.user) {
                  existingUser = newUser.user;
                }
              }

              // Generate instant magiclink token hash
              const { data: linkData } = await admin.auth.admin.generateLink({
                type: "magiclink",
                email: tokenEmail,
              });

              if (linkData?.properties?.hashed_token) {
                tokenHash = linkData.properties.hashed_token;
              }
            } catch (adminErr) {
              console.warn("[google-callback] Supabase admin link creation error:", adminErr);
            }
          }

          return Response.json({
            id_token: idToken,
            access_token: accessToken,
            token_hash: tokenHash,
            email: tokenEmail,
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
