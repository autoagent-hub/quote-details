import { Helmet } from "react-helmet-async";

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
const DEFAULT_OG_IMAGE = `${DEFAULT_DOMAIN}/logo.png`;

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

  const jsonLdContent =
    jsonLdGraph.length > 0
      ? {
          "@context": "https://schema.org",
          "@graph": jsonLdGraph,
        }
      : null;

  return (
    <Helmet>
      {/* 1. Title */}
      <title>{title}</title>

      {/* 2. Primary Meta Tags */}
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}
      <meta
        name="robots"
        content={
          noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"
        }
      />
      <link rel="canonical" href={currentCanonical} />

      {/* 3. Open Graph / Facebook */}
      <meta property="og:site_name" content="Detailr" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentCanonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:url" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />

      {/* 4. Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@detailronline" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:src" content={ogImage} />

      {/* 5. Structured Schema.org JSON-LD */}
      {jsonLdContent && <script type="application/ld+json">{JSON.stringify(jsonLdContent)}</script>}
    </Helmet>
  );
}
