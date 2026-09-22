import { queryClient } from "../lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

function ErrorComponent({ error, reset }: { error: Error | null; reset: () => void }) {
  if (typeof window !== "undefined") {
    console.error("[detailr-error]", error);
    try {
      reportLovableError(error, { boundary: "tanstack_root_error_component" });
    } catch {
      // ignore
    }
  }

  const handleReset = () => {
    try {
      reset();
    } catch {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

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
            onClick={handleReset}
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

function getPublicConfig() {
  const clientConfig =
    typeof window !== "undefined"
      ? (
          window as unknown as {
            __PUBLIC_CONFIG__?: {
              supabaseUrl?: string;
              supabaseAnonKey?: string;
              googleClientId?: string;
            };
          }
        ).__PUBLIC_CONFIG__
      : undefined;

  return {
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
    googleClientId:
      clientConfig?.googleClientId ||
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      (typeof process !== "undefined"
        ? process.env["VITE_GOOGLE_CLIENT_ID"] || process.env["GOOGLE_CLIENT_ID"]
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
}

const schemaJson = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://detailr.online/#website",
      url: "https://detailr.online",
      name: "Detailr Online",
      alternateName: ["Detailr", "Detailr Software", "Detailr Mobile Detailing"],
      description: "Instant Mobile Auto Detailing Quotes & Real-Time Lead Alerts",
      publisher: { "@id": "https://detailr.online/#organization" },
      inLanguage: "en-US",
      hasPart: [
        {
          "@type": "WebPage",
          "@id": "https://detailr.online/signup",
          name: "Start 7-Day Free Trial",
          url: "https://detailr.online/signup",
          description:
            "Create your mobile detailing quote link in under 2 minutes. No credit card required.",
        },
        {
          "@type": "WebPage",
          "@id": "https://detailr.online/login",
          name: "Detailer Portal Login",
          url: "https://detailr.online/login",
          description:
            "Sign in to manage your custom detailing packages, leads, and real-time Telegram alerts.",
        },
        {
          "@type": "WebPage",
          "@id": "https://detailr.online/demo",
          name: "Live Customer Quote Demo",
          url: "https://detailr.online/demo",
          description: "Test the mobile detailing instant pricing estimate calculator.",
        },
      ],
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://detailr.online/#nav-signup",
      name: "Start 7-Day Free Trial",
      url: "https://detailr.online/signup",
      description: "Launch your instant detailing quote link in under 3 minutes.",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://detailr.online/#nav-login",
      name: "Log In to Dashboard",
      url: "https://detailr.online/login",
      description: "Sign in to your Detailr mobile detailer portal.",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://detailr.online/#nav-demo",
      name: "Try Live Quote Demo",
      url: "https://detailr.online/demo",
      description: "See how your customers build instant quotes.",
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://detailr.online/#breadcrumbs",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://detailr.online/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Start Free Trial",
          item: "https://detailr.online/signup",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Detailer Login",
          item: "https://detailr.online/login",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Quote Demo",
          item: "https://detailr.online/demo",
        },
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://detailr.online/#webapp",
      name: "Detailr Online",
      url: "https://detailr.online",
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      description:
        "Instant customer quote builder and real-time lead alerts designed specifically for mobile auto detailers.",
      image: "https://detailr.online/logo.png",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        ratingCount: "48",
        bestRating: "5",
        worstRating: "1",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://detailr.online/#organization",
      name: "Detailr Online",
      url: "https://detailr.online",
      logo: "https://detailr.online/logo.png",
      image: "https://detailr.online/logo.png",
      sameAs: ["https://detailr.online"],
    },
  ],
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "Detailr Online — Instant Detailing Quotes & Real-Time Telegram Alerts" },
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
      { name: "author", content: "Detailr Online" },
      { name: "google-site-verification", content: "KcgCWTCmUyxEVd1lRMq6xabTrWkbMo0rsUFleV8q2m0" },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { name: "theme-color", content: "#0284c7" },
      { name: "application-name", content: "Detailr Online" },
      { name: "apple-mobile-web-app-title", content: "Detailr Online" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },

      // Open Graph / Facebook / LinkedIn
      { property: "og:site_name", content: "Detailr Online" },
      {
        property: "og:title",
        content: "Detailr Online — Instant Mobile Detailing Quotes & Telegram Alerts",
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
      { property: "og:image:url", content: "https://detailr.online/og-image.jpg" },
      { property: "og:image:secure_url", content: "https://detailr.online/og-image.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Detailr Online — Instant Quotes & Telegram Alerts for Mobile Auto Detailers",
      },

      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@detailronline" },
      { name: "twitter:creator", content: "@detailronline" },
      {
        name: "twitter:title",
        content: "Detailr Online — Instant Detailing Quotes & Real-Time Telegram Alerts",
      },
      {
        name: "twitter:description",
        content:
          "Convert mobile detailing inquiries on your website in seconds with automated quotes and instant Telegram alerts.",
      },
      { name: "twitter:image", content: "https://detailr.online/og-image.jpg" },
      { name: "twitter:image:src", content: "https://detailr.online/og-image.jpg" },
      { name: "twitter:image:alt", content: "Detailr Online Auto Detailing Quote Software" },

      // Schema.org itemprops for crawlers
      { name: "itemprop:name", content: "Detailr Online" },
      {
        name: "itemprop:description",
        content:
          "Instant customer quote builder and real-time Telegram lead alerts designed specifically for mobile auto detailers.",
      },
      { name: "itemprop:image", content: "https://detailr.online/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://detailr.online/" },
      { rel: "image_src", href: "https://detailr.online/og-image.jpg" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/logo.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [
      {
        children: `window.__PUBLIC_CONFIG__ = ${JSON.stringify(getPublicConfig())};`,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(schemaJson),
      },
      { src: "https://accounts.google.com/gsi/client", async: true, defer: true },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('detailr-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);

  // Register service worker and handle offline/online network status
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[ServiceWorker] Registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[ServiceWorker] Registration failed:", err);
          });
      });
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection Restored", {
        description: "Back online. Automatically syncing any pending quote requests...",
        id: "network-status",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info("Working Offline", {
        description:
          "Form progress is saved locally on your device and will auto-submit upon reconnecting.",
        icon: <WifiOff className="size-4 text-amber-500" />,
        duration: 7000,
        id: "network-status",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
    <>
      {/* Modern Glassmorphic Offline Indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-background/90 px-4 py-2.5 shadow-xl shadow-black/10 backdrop-blur-xl dark:bg-card/90 max-w-[90vw] sm:max-w-md"
          >
            <div className="relative flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <WifiOff className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-amber-500"></span>
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Working Offline</span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Auto-Sync Ready
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                Form progress saved locally • Will auto-submit on reconnect
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" richColors />
    </>
  );
}
