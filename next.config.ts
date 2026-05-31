import type { NextConfig } from "next";

const CANONICAL_HOST = "www.mooreanews.com";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "mooreanews.com" }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "lookaside.fbsbx.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "www.tahiti-infos.com" },
      { protocol: "https", hostname: "**.francetvinfo.fr" },
      { protocol: "https", hostname: "**.presidence.pf" },
      { protocol: "https", hostname: "**.radio1.pf" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
