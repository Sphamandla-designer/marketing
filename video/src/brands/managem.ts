import type { Brand } from "../core/brand";

// Colours and type are taken from the ManaGEM website's design tokens and the
// product itself. The logo is the supplied reversed lockup WITHOUT the tagline:
// the tagline promises job margin, which the product does not show.
export const managem: Brand = {
  id: "managem",
  name: "ManaGEM",
  colors: {
    base: "#0F172A",
    baseDeep: "#0B1222",
    hero: "#00BFA6",
    text: "#F1F5F9",
    textDim: "#94A3B8",
    line: "rgba(148, 163, 184, 0.28)",
  },
  fonts: {
    display: "Outfit",
    mono: "IBM Plex Mono",
    faces: [
      { family: "Outfit", file: "fonts/outfit-latin-wght.woff2", weight: "100 900" },
      { family: "IBM Plex Mono", file: "fonts/ibm-plex-mono-latin-400.woff2", weight: "400" },
      { family: "IBM Plex Mono", file: "fonts/ibm-plex-mono-latin-500.woff2", weight: "500" },
      { family: "IBM Plex Mono", file: "fonts/ibm-plex-mono-latin-600.woff2", weight: "600" },
    ],
  },
  logo: { file: "brands/managem/logo-reversed.png", width: 1028, height: 180 },
};
