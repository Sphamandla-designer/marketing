// The dark brand field behind an end card: a deep gradient, one slow drifting
// glow in the hero colour, fine grain and a soft vignette. Never used behind a
// product screen.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../core/brand";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

export const BrandField: React.FC<{ brand: Brand; children?: React.ReactNode }> = ({ brand, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const driftX = Math.sin(t / 2.6) * 60;
  const driftY = Math.cos(t / 3.4) * 36;
  return (
    <AbsoluteFill
      style={{ background: `radial-gradient(120% 90% at 50% 42%, ${brand.colors.base} 0%, ${brand.colors.baseDeep} 78%)` }}
    >
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1100,
          left: 210 + driftX,
          top: -40 + driftY,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${brand.colors.hero}1c, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      {children}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          backgroundImage: GRAIN,
          backgroundSize: "240px",
          backgroundPosition: `${(frame * 37) % 240}px ${(frame * 61) % 240}px`,
          opacity: 0.07,
          mixBlendMode: "overlay",
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.34) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
