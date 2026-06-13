import type { NextConfig } from "next";

const CANONICAL_HOST = "www.mooreanews.com";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js"],
  outputFileTracingIncludes: {
    "/api/cron/garde-weekend": [
      "./node_modules/tesseract.js-core/**/*.wasm",
      "./node_modules/tesseract.js-core/**/*.wasm.js",
      "./node_modules/tesseract.js/dist/**",
      "./node_modules/tesseract.js/src/worker-script/**",
      "./data/ocr/**",
    ],
    "/api/cron/daily": [
      "./node_modules/tesseract.js-core/**/*.wasm",
      "./node_modules/tesseract.js-core/**/*.wasm.js",
      "./node_modules/tesseract.js/dist/**",
      "./node_modules/tesseract.js/src/worker-script/**",
      "./data/ocr/**",
    ],
  },
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
    localPatterns: [
      {
        pathname: "/api/facebook-cover",
        // slug=… pour les articles mooreanews-fb-* sans cover Supabase
      },
      {
        pathname: "/api/garde-weekend/poster/**",
      },
    ],
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
      { protocol: "https", hostname: "www.tntvnews.pf" },
      { protocol: "https", hostname: "**.tntvnews.pf" },
      { protocol: "https", hostname: "www.ordre-pharmaciens-polynesie.com" },
      { protocol: "https", hostname: "**.ordre-pharmaciens-polynesie.com" },
    ],
  },
};

export default nextConfig;
