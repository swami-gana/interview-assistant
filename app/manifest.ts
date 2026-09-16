import type { MetadataRoute } from "next";
import { copy } from "@/lib/copy";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: copy("appTitle"),
    short_name: "Interviews",
    description: copy("signInSubtitle"),
    start_url: "/queue",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    categories: ["productivity", "business"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
