import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    // Serve modern formats; the storefront catalog is image-heavy.
    formats: ["image/avif", "image/webp"],
    // Supabase Storage public buckets (product-media, homepage-media).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
