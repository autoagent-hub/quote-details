import React from "react";
import { Helmet } from "react-helmet-async";

export interface HelmetSEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

const DEFAULT_TITLE = "Detailr Online — Instant Detailing Quotes & Real-Time Telegram Alerts";
const DEFAULT_DESCRIPTION =
  "Give car detailing customers instant pricing estimates on your website and receive new qualified leads directly in Telegram with vehicle photos.";
const DEFAULT_URL = "https://detailr.online";
const DEFAULT_OG_IMAGE = "https://detailr.online/og-image.jpg";

export function HelmetSEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl = DEFAULT_URL,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noIndex = false,
}: HelmetSEOProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={
          noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"
        }
      />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
