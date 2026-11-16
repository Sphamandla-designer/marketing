// Plays a FilmSpec: shots as hard cuts, dialogue as subtitles, sound as cues.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../core/brand";
import type { Cue, FilmSpec, Shot } from "../core/film";
import { loadBrandFonts } from "../core/fonts";
import { timecode, toFrames } from "../core/time";
import { EndCard } from "./EndCard";
import { ScreenInsert } from "./ScreenInsert";
import { Slate } from "./Slate";
import { Subtitles } from "./Subtitle";

export type FilmProps = {
  brand: Brand;
  spec: FilmSpec;
  /** Animatic furniture: timecode, shot number, dialogue. Off for a clean pass. */
  guides?: boolean;
};

const ShotView: React.FC<{ brand: Brand; spec: FilmSpec; shot: Shot; guides: boolean }> = ({ brand, spec, shot, guides }) => {
  switch (shot.kind) {
    case "slate":
      return <Slate brand={brand} shot={shot} chain={spec.chain} />;
    case "screen":
      return <ScreenInsert src={shot.src} />;
    case "plate":
      return (
        <AbsoluteFill>
          <ScreenInsert src={shot.src} />
          {guides ? (
            <div
              style={{
                position: "absolute",
                right: 40,
                bottom: 110,
                padding: "12px 20px",
                background: "rgba(11,18,34,0.92)",
                borderRadius: 8,
                fontFamily: brand.fonts.mono,
                fontSize: 21,
                letterSpacing: "0.05em",
                color: brand.colors.text,
              }}
            >
              SHOT {shot.id.padStart(2, "0")} · PLACEHOLDER · {shot.note}
            </div>
          ) : null}
        </AbsoluteFill>
      );
    case "endcard":
      return <EndCard brand={brand} {...shot.card} />;
  }
};

const CueView: React.FC<{ cue: Cue; fps: number; total: number }> = ({ cue, fps, total }) => {
  const from = toFrames(cue.start, fps);
  const to = cue.end === undefined ? total : toFrames(cue.end, fps);
  const offsetSec = cue.lockToTimeline ? cue.lockToTimeline.bedOffset + cue.start : cue.offset ?? 0;
  return (
    <Sequence from={from} durationInFrames={Math.max(1, to - from)} layout="none">
      <Audio src={staticFile(cue.src)} volume={cue.volume ?? 1} trimBefore={toFrames(offsetSec, fps)} />
    </Sequence>
  );
};

const Burnin: React.FC<{ brand: Brand; spec: FilmSpec }> = ({ brand, spec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shot = spec.shots.find((s) => frame >= toFrames(s.start, fps) && frame < toFrames(s.end, fps));
  if (!shot || shot.kind !== "slate") return null; // never drawn over product screens or the end card
  return (
    <div
      style={{
        position: "absolute",
        right: 120,
        bottom: 250,
        display: "flex",
        columnGap: 28,
        alignItems: "baseline",
        fontFamily: brand.fonts.mono,
        fontSize: 24,
        letterSpacing: "0.08em",
        color: "rgba(241,245,249,0.7)",
      }}
    >
      <span>
        {spec.title.toUpperCase()} · ANIMATIC {spec.version}
      </span>
      <span style={{ color: "#F1F5F9", fontWeight: 600 }}>{timecode(frame, fps)}</span>
    </div>
  );
};

export const Film: React.FC<FilmProps> = ({ brand, spec, guides = true }) => {
  loadBrandFonts(brand);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const current = spec.shots.find((s) => frame >= toFrames(s.start, fps) && frame < toFrames(s.end, fps));
  const overScreen = current?.kind === "screen" || current?.kind === "plate";
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {spec.shots.map((shot) => {
        const from = toFrames(shot.start, fps);
        const dur = toFrames(shot.end, fps) - from;
        return (
          <Sequence key={shot.id} from={from} durationInFrames={dur} name={`Shot ${shot.id}`}>
            <ShotView brand={brand} spec={spec} shot={shot} guides={guides} />
          </Sequence>
        );
      })}
      {spec.cues.map((cue, i) => (
        <CueView key={i} cue={cue} fps={fps} total={durationInFrames} />
      ))}
      {guides ? <Burnin brand={brand} spec={spec} /> : null}
      {/* The end card is finished picture: nothing is drawn over it. */}
      {guides && current?.kind !== "endcard" ? <Subtitles brand={brand} lines={spec.lines} compact={overScreen} /> : null}
    </AbsoluteFill>
  );
};
