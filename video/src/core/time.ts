// Scripts are written in seconds and tenths. Frames are derived, never typed.
export const toFrames = (seconds: number, fps: number): number => Math.round(seconds * fps);

export const timecode = (frame: number, fps: number): string => {
  const total = Math.max(0, frame);
  const s = Math.floor(total / fps);
  const f = total % fps;
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}:${String(f).padStart(2, "0")}`;
};
