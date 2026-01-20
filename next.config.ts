import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  // Image optimization for external images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile images
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com", // Facebook profile images
      },
      {
        protocol: "https",
        hostname: "replicate.delivery", // Replicate AI generated images
      },
      {
        protocol: "https",
        hostname: "*.replicate.delivery", // Replicate AI subdomains
      },
      {
        protocol: "https",
        hostname: "pbxt.replicate.delivery", // Replicate predictions
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "10mb", // For 3D model uploads
    },
  },
};

export default withNextIntl(nextConfig);
