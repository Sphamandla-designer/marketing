// A broadcast end card: logo, one line, one call to action.
// Reusable across campaigns: pass a Brand and the copy.
//
// Motion: the logo settles first, a hairline draws out from the centre, the
// line rises word by word from behind a mask, and the call to action arrives
// last. Everything then holds still. Nothing bounces.
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../core/brand";
import { loadBrandFonts } from "../core/fonts";
import { clamp, ease, springs } from "../core/motion";
import { toFrames } from "../core/time";
import { BrandField } from "./BrandField";

export type EndCardProps = {
  brand: Brand;
  line: string;
  cta: string;
  url: string;
  /** Seconds from the start of the card at which the call to action appears. */
  ctaAt?: number;
  /** Seconds of fade to black at the very end. 0 holds the card to the last frame. */
  fadeOut?: number;
};

const MaskedWord: React.FC<{ word: string; at: number }> = ({ word, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: springs.crisp });
  return (
    <span style={{ display: "inline-block", overflow: "hidden", paddingBottom: 14, marginBottom: -14 }}>
      <span
        style={{
          display: "inline-block",
          opacity: interpolate(p, [0, 0.6], [0, 1], clamp),
          transform: `translateY(${interpolate(p, [0, 1], [72, 0])}px)`,
        }}
      >
        {word}
      </span>
    </span>
  );
};

export const EndCard: React.FC<EndCardProps> = ({ brand, line, cta, url, ctaAt = 1.5, fadeOut = 0.24 }) => {
  loadBrandFonts(brand);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const logoIn = spring({ frame: frame - toFrames(0.08, fps), fps, config: springs.settle });
  const ruleIn = interpolate(frame, [toFrames(0.36, fps), toFrames(1.0, fps)], [0, 1], { ...clamp, easing: ease.out });
  const lineStart = toFrames(0.52, fps);
  const perWord = toFrames(0.1, fps);
  const ctaStart = toFrames(ctaAt, fps);
  const ctaIn = spring({ frame: frame - ctaStart, fps, config: springs.settle });
  const urlIn = spring({ frame: frame - ctaStart - toFrames(0.16, fps), fps, config: springs.settle });

  const out = toFrames(fadeOut, fps);
  const exit =
    out > 0
      ? interpolate(frame, [durationInFrames - out, durationInFrames - 1], [1, 0], { ...clamp, easing: ease.in })
      : 1;

  const logoW = 560;
  const logoH = (logoW * brand.logo.height) / brand.logo.width;
  const words = line.split(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ opacity: exit }}>
        <BrandField brand={brand}>
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              fontFamily: brand.fonts.display,
              color: brand.colors.text,
            }}
          >
            <Img
              src={staticFile(brand.logo.file)}
              style={{
                width: logoW,
                height: logoH,
                opacity: logoIn,
                transform: `translateY(${interpolate(logoIn, [0, 1], [22, 0])}px) scale(${interpolate(logoIn, [0, 1], [0.965, 1])})`,
              }}
            />
            <div
              style={{
                width: 132,
                height: 2,
                marginTop: 54,
                marginBottom: 50,
                background: brand.colors.hero,
                opacity: ruleIn,
                transform: `scaleX(${ruleIn})`,
              }}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                columnGap: 22,
                fontSize: 84,
                fontWeight: 600,
                letterSpacing: "-0.022em",
                lineHeight: 1.08,
                maxWidth: 1500,
              }}
            >
              {words.map((w, i) => (
                <MaskedWord key={i} word={w} at={lineStart + i * perWord} />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                columnGap: 26,
                marginTop: 76,
                height: 48,
              }}
            >
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 500,
                  letterSpacing: "0.005em",
                  opacity: ctaIn,
                  transform: `translateY(${interpolate(ctaIn, [0, 1], [16, 0])}px)`,
                }}
              >
                {cta}
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: brand.colors.textDim,
                  opacity: urlIn,
                  transform: `scale(${urlIn})`,
                }}
              />
              <span
                style={{
                  fontFamily: brand.fonts.mono,
                  fontSize: 32,
                  fontWeight: 500,
                  color: brand.colors.hero,
                  opacity: urlIn,
                  transform: `translateY(${interpolate(urlIn, [0, 1], [16, 0])}px)`,
                }}
              >
                {url}
              </span>
            </div>
          </AbsoluteFill>
        </BrandField>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
