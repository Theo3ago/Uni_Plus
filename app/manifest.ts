import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Uni+",
    short_name: "Uni+",
    description: "Ne vivez plus jamais avec le mauvais coloc.",
    lang: "fr-CA",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8FB",
    theme_color: "#13294B",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
