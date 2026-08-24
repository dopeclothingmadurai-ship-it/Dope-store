import type { Metadata } from "next";
import {
  Bodoni_Moda,
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
} from "next/font/google";

import { storeConfig } from "@/config/store";
import { SITE_NAME, SITE_URL } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display serif — used only by the storefront headlines.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

// High-contrast fashion serif for the hero campaign line (Bodoni-inspired).
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const DESCRIPTION =
  "Dope Store — premium streetwear and fashion in Madurai, Tamil Nadu. Considered clothing, curated drops, and in-store pickup. Feeding the culture, starving the hype.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Premium Streetwear & Fashion, Madurai`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Dope Store",
    "Dope Store Madurai",
    "streetwear Madurai",
    "fashion Madurai",
    "premium clothing Tamil Nadu",
    "men's fashion Madurai",
    "clothing store Madurai",
  ],
  category: "shopping",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Premium Streetwear & Fashion, Madurai`,
    description: DESCRIPTION,
    url: "/",
    locale: "en_IN",
    images: [
      { url: "/og.jpg", width: 1200, height: 630, alt: "Dope Store" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Premium Streetwear & Fashion, Madurai`,
    description: DESCRIPTION,
    images: ["/og.jpg"],
  },
};

/**
 * Site-wide structured data (SEO + Generative Engine Optimization). Establishes
 * Dope Store as a clothing retailer in Madurai as a clear entity for search and
 * AI answer engines. Only real, on-site information is described.
 */
function StructuredData() {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      image: `${SITE_URL}/og.jpg`,
      email: storeConfig.email,
      telephone: `+91${storeConfig.phone}`,
      sameAs: [
        storeConfig.social.instagram,
        storeConfig.social.facebook,
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "ClothingStore",
      "@id": `${SITE_URL}/#store`,
      name: SITE_NAME,
      url: SITE_URL,
      image: `${SITE_URL}/og.jpg`,
      email: storeConfig.email,
      telephone: `+91${storeConfig.phone}`,
      priceRange: "₹₹",
      currenciesAccepted: "INR",
      parentOrganization: { "@id": `${SITE_URL}/#organization` },
      address: {
        "@type": "PostalAddress",
        streetAddress: storeConfig.address.line1,
        addressLocality: storeConfig.address.city,
        addressRegion: storeConfig.address.state,
        postalCode: storeConfig.address.pincode,
        addressCountry: "IN",
      },
      areaServed: "Madurai, Tamil Nadu, India",
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${bodoni.variable} antialiased`}
      >
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
