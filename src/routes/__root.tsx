import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "../components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { QuoteFlowLogo } from "../components/QuoteFlowLogo";
import { supabase } from "../integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <QuoteFlowLogo size="xl" linkToHome />
        </div>
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <QuoteFlowLogo size="lg" linkToHome />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        {error?.message && (
          <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-left">
            <p className="font-mono text-xs text-muted-foreground break-all">{error.message}</p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "Detailr — Instant Detailing Quotes & Real-Time Telegram Alerts (detailr.online)" },
      {
        name: "description",
        content:
          "Detailr (detailr.online) is the modern software built for mobile auto detailers. Give customers instant vehicle pricing estimates and receive new qualified leads directly in Telegram with photos.",
      },
      {
        name: "keywords",
        content:
          "mobile auto detailing software, car detailing quote calculator, detailer instant estimate, telegram lead alerts, auto detailing CRM, ceramic coating quote builder, mobile detailer booking, detailr online",
      },
      { name: "author", content: "Detailr" },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { name: "theme-color", content: "#0284c7" },
      { name: "application-name", content: "Detailr" },
      { name: "apple-mobile-web-app-title", content: "Detailr" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },

      // Open Graph / Facebook / LinkedIn
      { property: "og:site_name", content: "Detailr" },
      {
        property: "og:title",
        content: "Detailr — Instant Mobile Detailing Quotes & Telegram Alerts",
      },
      {
        property: "og:description",
        content:
          "Turn your mobile detailing website visitors into paying jobs with instant pricing estimates and real-time Telegram alerts on your phone.",
      },
      { property: "og:url", content: "https://detailr.online/" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: "https://detailr.online/og-image.jpg" },
      { property: "og:image:secure_url", content: "https://detailr.online/og-image.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Detailr — Instant Quotes & Telegram Alerts for Mobile Auto Detailers",
      },

      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Detailr — Instant Detailing Quotes & Real-Time Telegram Alerts",
      },
      {
        name: "twitter:description",
        content:
          "Convert mobile detailing inquiries on your website in seconds with automated quotes and instant Telegram alerts.",
      },
      { name: "twitter:image", content: "https://detailr.online/og-image.jpg" },
      { name: "twitter:image:alt", content: "Detailr Auto Detailing Quote Software" },
    ],
    links: [
      { rel: "canonical", href: "https://detailr.online/" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Priority: 1. Injected window.__PUBLIC_CONFIG__ (client runtime), 2. Vite import.meta.env, 3. process.env (Node SSR)
  const clientConfig =
    typeof window !== "undefined"
      ? (
          window as unknown as {
            __PUBLIC_CONFIG__?: { supabaseUrl?: string; supabaseAnonKey?: string };
          }
        ).__PUBLIC_CONFIG__
      : undefined;

  const publicConfig = {
    supabaseUrl:
      clientConfig?.supabaseUrl ||
      import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env["SUPABASE_URL"] ||
      (typeof process !== "undefined"
        ? process.env["VITE_SUPABASE_URL"] ||
          process.env["SUPABASE_URL"] ||
          process.env["EXTERNAL_SUPABASE_URL"]
        : "") ||
      "",
    supabaseAnonKey:
      clientConfig?.supabaseAnonKey ||
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
      import.meta.env["SUPABASE_PUBLISHABLE_KEY"] ||
      import.meta.env["SUPABASE_ANON_KEY"] ||
      (typeof process !== "undefined"
        ? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
          process.env["VITE_SUPABASE_ANON_KEY"] ||
          process.env["SUPABASE_PUBLISHABLE_KEY"] ||
          process.env["SUPABASE_ANON_KEY"]
        : "") ||
      "",
  };

  const schemaJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://detailr.online/#webapp",
        name: "Detailr",
        url: "https://detailr.online",
        applicationCategory: "BusinessApplication",
        operatingSystem: "All",
        browserRequirements: "Requires JavaScript. Requires HTML5.",
        description:
          "Instant customer quote builder and real-time Telegram lead alerts designed specifically for mobile auto detailers.",
        image: "https://detailr.online/og-image.jpg",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://detailr.online/#organization",
        name: "Detailr",
        url: "https://detailr.online",
        logo: "https://detailr.online/favicon.png",
        sameAs: ["https://detailr.online"],
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `window.__PUBLIC_CONFIG__ = ${JSON.stringify(publicConfig)};`,
          }}
        />
        <script
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaJson),
          }}
        />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && typeof window !== "undefined") {
          const path = window.location.pathname;
          if (path === "/login" || path === "/signup" || path === "/auth") {
            navigate({ to: "/dashboard" });
          }
        }
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      console.warn("Auth state subscription init failed:", err);
    }
  }, [navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
