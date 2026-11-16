import React from "react";
import { Composition } from "remotion";
import { managem } from "./brands/managem";
import { EndCard } from "./components/EndCard";
import { Film } from "./components/Film";
import type { FilmSpec } from "./core/film";
import { toFrames } from "./core/time";
import { pleaseHold45, productInserts } from "./films/please-hold/spec";

const filmComposition = (id: string, spec: FilmSpec, guides: boolean) => (
  <Composition
    id={id}
    component={Film}
    durationInFrames={toFrames(spec.duration, spec.fps)}
    fps={spec.fps}
    width={spec.width}
    height={spec.height}
    defaultProps={{ brand: managem, spec, guides }}
  />
);

// To add a campaign: add a Brand in src/brands, a FilmSpec in src/films, and
// register compositions here.
export const Root: React.FC = () => (
  <>
    {filmComposition("PleaseHold-Animatic-45", pleaseHold45, true)}
    {filmComposition("PleaseHold-ProductInserts", productInserts, false)}
    <Composition
      id="PleaseHold-EndCard"
      component={EndCard}
      durationInFrames={toFrames(3.5, 25)}
      fps={25}
      width={1920}
      height={1080}
      defaultProps={{
        brand: managem,
        line: "Know where every job stands.",
        cta: "Start your free trial",
        url: "managem.co.za",
        ctaAt: 1.5,
        fadeOut: 0.24,
      }}
    />
  </>
);
