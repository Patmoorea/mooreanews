import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/app",
    display: "standalone",
    background_color: "#0c4a6e",
    theme_color: "#06b6d4",
    orientation: "portrait",
    lang: "fr-PF",
    categories: ["news", "weather", "travel"],
    shortcuts: [
      {
        name: "Moorea du jour",
        url: "/app",
        description: "Ferries, météo et alertes",
      },
      {
        name: "Alertes",
        url: "/alertes",
      },
      {
        name: "Ferries",
        url: "/#en-direct",
      },
    ],
    icons: [
      {
        src: "/brand/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
