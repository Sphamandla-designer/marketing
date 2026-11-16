// A product screen shown exactly as captured.
//
// Deliberately does nothing: no zoom, no pan, no grade, no grain, no vignette,
// no rounded mask, no fade. The capture is drawn at its native size, one image
// pixel to one output pixel when the capture matches the composition. If a
// product screen needs to look better, change the capture, never this file.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

export const ScreenInsert: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Img
      src={staticFile(src)}
      style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "auto" }}
    />
  </AbsoluteFill>
);
