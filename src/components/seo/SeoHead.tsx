import { useEffect } from "react";

export interface BusinessDetails {
  name: string;
  description?: string;
  url?: string;
  phone?: string;
  email?: string;
  image?: string;
  priceRange?: string; // e.g. "$$"
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  servicesOffered?: string[];
}

export interface SeoHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: "website" | "article" | "profile" | "business";
  noIndex?: boolean;
  businessDetails?: BusinessDetails;
  additionalJsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULT_DOMAIN = "https://detailr.online";
const DEFAULT_TITLE = "Detailr Online — Instant Detailing Quotes & Real-Time Telegram Alerts";
const DEFAULT_DESCRIPTION =
  "Give car detailing customers instant pricing estimates on your website and receive new qualified leads directly in Telegram with vehicle photos.";
const DEFAULT_OG_IMAGE = `${DEFAULT_DOMAIN}/og-image.jpg`;

export function SeoHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  keywords = [],
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noIndex = false,
  businessDetails,
  additionalJsonLd,
}: SeoHeadProps) {
  const currentCanonical =
    canonicalUrl ||
    (typeof window !== "undefined" ? window.location.href.split("?")[0] : DEFAULT_DOMAIN);

  useEffect(() => {
    if (typeof document === "undefined") return;

    // 1. Title
    document.title = title;

    // 2. Helper to set meta tags
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attrName, attrVal);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    // Meta Description & Keywords
    setMetaTag('meta[name="description"]', "name", "description", description);
    if (keywords.length > 0) {
      setMetaTag('meta[name="keywords"]', "name", "keywords", keywords.join(", "));
    }

    // Robots
    setMetaTag(
      'meta[name="robots"]',
      "name",
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1",
    );

    // Open Graph
    setMetaTag('meta[property="og:title"]', "property", "og:title", title);
    setMetaTag('meta[property="og:description"]', "property", "og:description", description);
    setMetaTag('meta[property="og:url"]', "property", "og:url", currentCanonical);
    setMetaTag('meta[property="og:type"]', "property", "og:type", ogType);
    setMetaTag('meta[property="og:image"]', "property", "og:image", ogImage);

    // Twitter
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMetaTag('meta[name="twitter:image"]', "name", "twitter:image", ogImage);

    // Canonical link tag
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", currentCanonical);

    // Dynamic JSON-LD injection
    const jsonLdGraph: Record<string, unknown>[] = [];

    if (businessDetails) {
      const localBusinessSchema: Record<string, unknown> = {
        "@type": "AutoRepair",
        "@id": `${businessDetails.url || currentCanonical}#localbusiness`,
        name: businessDetails.name,
        description: businessDetails.description || description,
        url: businessDetails.url || currentCanonical,
        image: businessDetails.image || ogImage,
        priceRange: businessDetails.priceRange || "$$",
      };

      if (businessDetails.phone) {
        localBusinessSchema.telephone = businessDetails.phone;
      }

      if (businessDetails.email) {
        localBusinessSchema.email = businessDetails.email;
      }

      if (businessDetails.address) {
        localBusinessSchema.address = {
          "@type": "PostalAddress",
          ...businessDetails.address,
        };
      }

      if (businessDetails.geo) {
        localBusinessSchema.geo = {
          "@type": "GeoCoordinates",
          latitude: businessDetails.geo.latitude,
          longitude: businessDetails.geo.longitude,
        };
      }

      if (businessDetails.openingHours && businessDetails.openingHours.length > 0) {
        localBusinessSchema.openingHours = businessDetails.openingHours;
      }

      if (businessDetails.aggregateRating) {
        localBusinessSchema.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: businessDetails.aggregateRating.ratingValue,
          reviewCount: businessDetails.aggregateRating.reviewCount,
          bestRating: 5,
          worstRating: 1,
        };
      }

      if (businessDetails.servicesOffered && businessDetails.servicesOffered.length > 0) {
        localBusinessSchema.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: "Auto Detailing Services",
          itemListElement: businessDetails.servicesOffered.map((service, index) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: service,
            },
            position: index + 1,
          })),
        };
      }

      jsonLdGraph.push(localBusinessSchema);
    }

    if (additionalJsonLd) {
      if (Array.isArray(additionalJsonLd)) {
        jsonLdGraph.push(...additionalJsonLd);
      } else {
        jsonLdGraph.push(additionalJsonLd);
      }
    }

    if (jsonLdGraph.length > 0) {
      const scriptId = "dynamic-seo-jsonld";
      let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.id = scriptId;
        scriptTag.type = "application/ld+json";
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": jsonLdGraph,
      });
    }
  }, [
    title,
    description,
    currentCanonical,
    keywords,
    ogImage,
    ogType,
    noIndex,
    businessDetails,
    additionalJsonLd,
  ]);

  return null;
}
