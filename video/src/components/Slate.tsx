// A text board standing in for a shot that does not exist yet.
// It cuts in hard and sits still, as the real shot will. The only thing that
// moves is the thin bar showing how much of the shot has played.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../core/brand";
import type { ChainLink, SlateShot, Tone } from "../core/film";

const TONES: Record<Tone, { a: string; b: string; label: string }> = {
  cool: { a: "#1B2433", b: "#111826", label: "#9FB3CC" },
  warm: { a: "#33281B", b: "#1E1710", label: "#D9B27A" },
  neutral: { a: "#2A2B22", b: "#17180F", label: "#C3C59B" },
  store: { a: "#23272B", b: "#131619", label: "#AEB8C0" },
  morning: { a: "#2B3138", b: "#1A1F25", label: "#D5DDE5" },
};

export const Slate: React.FC<{ brand: Brand; shot: SlateShot; chain?: ChainLink[] }> = ({ brand, shot, chain }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const tone = TONES[shot.tone];
  const progress = Math.min(1, (frame + 1) / durationInFrames);
  const mono = brand.fonts.mono;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${tone.a} 0%, ${tone.b} 100%)`,
        fontFamily: brand.fonts.display,
        color: "#F1F5F9",
      }}
    >
      {/* shot number, large and quiet */}
      <div
        style={{
          position: "absolute",
          right: 96,
          top: 150,
          fontSize: 420,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: "rgba(255,255,255,0.045)",
        }}
      >
        {shot.id.padStart(2, "0")}
      </div>

      <div style={{ position: "absolute", left: 120, top: 190, width: 1380 }}>
        <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 500, letterSpacing: "0.14em", color: tone.label }}>
          SHOT {shot.id.padStart(2, "0")}
        </div>
        <div style={{ marginTop: 22, fontSize: 58, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.1 }}>
          {shot.slug}
        </div>
        <div style={{ marginTop: 18, fontFamily: mono, fontSize: 25, color: "rgba(241,245,249,0.62)" }}>{shot.frame}</div>
        <div
          style={{
            marginTop: 44,
            fontSize: 40,
            fontWeight: 400,
            lineHeight: 1.36,
            color: "rgba(241,245,249,0.92)",
            maxWidth: 1240,
          }}
        >
          {shot.action}
        </div>
        {shot.sound ? (
          <div style={{ marginTop: 40, display: "flex", alignItems: "baseline", columnGap: 18 }}>
            <span style={{ fontFamily: mono, fontSize: 21, letterSpacing: "0.14em", color: tone.label }}>SOUND</span>
            <span style={{ fontSize: 30, color: "rgba(241,245,249,0.74)" }}>{shot.sound}</span>
          </div>
        ) : null}
      </div>

      {/* the chain: who is waiting on whom, and for what */}
      {chain && shot.chain !== undefined ? (
        <div style={{ position: "absolute", left: 120, top: 84, display: "flex", alignItems: "center", columnGap: 16 }}>
          {chain.map((link, i) => {
            const on = i === shot.chain;
            return (
              <React.Fragment key={link.name}>
                {i > 0 ? <div style={{ width: 44, height: 2, background: "rgba(241,245,249,0.22)" }} /> : null}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    columnGap: 12,
                    padding: "10px 20px",
                    borderRadius: 999,
                    border: `1.5px solid ${on ? tone.label : "rgba(241,245,249,0.2)"}`,
                    background: on ? "rgba(255,255,255,0.08)" : "transparent",
                    opacity: on ? 1 : 0.55,
                  }}
                >
                  <span style={{ fontSize: 26, fontWeight: 600 }}>{link.name}</span>
                  <span style={{ fontFamily: mono, fontSize: 19, letterSpacing: "0.06em", color: tone.label }}>
                    {link.holds}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 120,
          bottom: 250,
          fontFamily: mono,
          fontSize: 21,
          letterSpacing: "0.06em",
          color: "rgba(241,245,249,0.5)",
        }}
      >
        HOW THIS SHOT IS MADE · {shot.method}
      </div>

      {/* shot progress */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: tone.label }} />
      </div>
    </AbsoluteFill>
  );
};
