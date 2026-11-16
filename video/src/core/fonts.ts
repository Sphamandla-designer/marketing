// Loads a brand's self-hosted fonts and holds the render until they are ready,
// so no frame is ever drawn in a fallback face.
import { continueRender, delayRender, staticFile } from "remotion";
import type { Brand } from "./brand";

const loaded = new Set<string>();

export const loadBrandFonts = (brand: Brand): void => {
  if (typeof document === "undefined" || loaded.has(brand.id)) return;
  loaded.add(brand.id);
  const handle = delayRender(`fonts:${brand.id}`);
  Promise.all(
    brand.fonts.faces.map((f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)}) format("woff2")`, {
        weight: f.weight,
        style: f.style ?? "normal",
      });
      return face.load().then((ok) => {
        document.fonts.add(ok);
      });
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error("Font load failed", err);
      continueRender(handle);
    });
};
