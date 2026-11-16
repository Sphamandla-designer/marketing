// A film is data: shots, dialogue and sound, all timed in seconds.
// The same engine plays any campaign's animatic.
import type { EndCardProps } from "../components/EndCard";

export type Tone = "cool" | "warm" | "neutral" | "store" | "morning";

type ShotBase = {
  id: string; // shot number as it appears in the script
  start: number; // seconds
  end: number; // seconds
};

/** A text board standing in for a shot that has not been made yet. */
export type SlateShot = ShotBase & {
  kind: "slate";
  slug: string; // INT. / EXT. line
  frame: string; // shot size, lens, movement
  action: string;
  tone: Tone;
  method: string; // how the real shot will be made
  chain?: number; // index into FilmSpec.chain of the active link
  sound?: string; // what we should be hearing
};

/** A real product screen, shown untouched. */
export type ScreenShot = ShotBase & {
  kind: "screen";
  src: string;
};

/** A real image standing in for a shot that will be filmed. Labelled as such. */
export type PlateShot = ShotBase & {
  kind: "plate";
  src: string;
  note: string;
};

export type EndCardShot = ShotBase & {
  kind: "endcard";
  card: Omit<EndCardProps, "brand">;
};

export type Shot = SlateShot | ScreenShot | PlateShot | EndCardShot;

export type Line = {
  start: number;
  end: number;
  who: string;
  text: string;
  via?: "on-camera" | "phone" | "off-camera" | "voiceover";
};

export type Cue = {
  src: string; // path under public/
  start: number; // seconds on the film's timeline
  end?: number; // omit to play the file to its end
  volume?: number;
  /** Seconds into the file to begin from. */
  offset?: number;
  /**
   * For a sound that runs continuously under several shots (a tune heard from
   * different rooms): the file position is locked to the film's clock, so a cut
   * between two cues of the same bed never jumps in the music.
   */
  lockToTimeline?: { bedOffset: number };
};

export type ChainLink = { name: string; holds: string };

export type FilmSpec = {
  title: string;
  version: string;
  fps: number;
  width: number;
  height: number;
  duration: number; // seconds
  chain?: ChainLink[];
  shots: Shot[];
  lines: Line[];
  cues: Cue[];
};
