// Dialogue for an animatic that has no recorded voices yet.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../core/brand";
import type { Line } from "../core/film";
import { toFrames } from "../core/time";

const VIA: Record<NonNullable<Line["via"]>, string> = {
  "on-camera": "",
  phone: "on the phone",
  "off-camera": "off camera",
  voiceover: "voiceover",
};

export const Subtitles: React.FC<{ brand: Brand; lines: Line[]; compact?: boolean }> = ({ brand, lines, compact }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const live = lines.filter((l) => frame >= toFrames(l.start, fps) && frame < toFrames(l.end, fps));
  if (live.length === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: compact ? 0 : 84,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        rowGap: 10,
        fontFamily: brand.fonts.display,
      }}
    >
      {live.map((l, i) => {
        const vo = l.via === "voiceover";
        const tag = l.via ? VIA[l.via] : "";
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              columnGap: 20,
              padding: compact ? "14px 34px" : "18px 36px",
              width: compact ? "100%" : undefined,
              justifyContent: "center",
              boxSizing: "border-box",
              background: compact ? "rgba(11, 18, 34, 0.94)" : "rgba(11, 18, 34, 0.86)",
              borderRadius: compact ? 0 : 10,
              borderTop: compact ? `1px solid ${brand.colors.line}` : undefined,
            }}
          >
            <span
              style={{
                fontFamily: brand.fonts.mono,
                fontSize: 21,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: vo ? brand.colors.hero : brand.colors.textDim,
                whiteSpace: "nowrap",
              }}
            >
              {l.who}
              {tag ? ` · ${tag}` : ""}
            </span>
            <span
              style={{
                fontSize: 40,
                fontWeight: vo ? 600 : 500,
                fontStyle: l.via === "phone" ? "italic" : "normal",
                color: brand.colors.text,
                letterSpacing: "-0.005em",
              }}
            >
              {l.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};
