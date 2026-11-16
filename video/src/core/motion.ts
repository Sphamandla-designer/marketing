// Shared motion vocabulary. Every easing and spring in the project comes from
// here, so a campaign's feel can be tuned in one place.
import { Easing } from "remotion";

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // entrances
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // moves
  in: Easing.bezier(0.7, 0, 0.84, 0), // exits
} as const;

export const springs = {
  // Calm and weighty: no overshoot. Right for a broadcast end card.
  settle: { damping: 200, stiffness: 120, mass: 1 },
  // A little quicker, still no bounce. Words and rules.
  crisp: { damping: 200, stiffness: 220, mass: 0.7 },
} as const;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
