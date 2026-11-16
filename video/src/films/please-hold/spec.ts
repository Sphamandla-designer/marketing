// "Please Hold" — 45-second master, as data.
//
// Part one (shots 1-8) follows please-hold-production-readiness.md.
// Part two (shots 9-17) follows please-hold-product-truth.md.
//
// One deliberate difference from the script: the spoken figures, customer and
// foreman in part two are the ManaGEM prototype's own example data, because the
// words must match the screen. They change when the clean example account for
// the film exists. The figure Lerato gives on day one is a placeholder chosen
// only so that it differs from day two.
import type { FilmSpec } from "../../core/film";

const A = "films/please-hold/audio/";
const S = "films/please-hold/screens/";

// Where the hold tune is in its loop at 0:00, chosen so that it reaches the
// unresolved leading note at the moment Anusha ends the call.
const TUNE = { bedOffset: 11.36 };
// The count runs from the moment we first hear it, down the phone line.
const COUNT = { bedOffset: -10 };

export const pleaseHold45: FilmSpec = {
  title: "Please Hold",
  version: "v1",
  fps: 25,
  width: 1920,
  height: 1080,
  duration: 45,
  chain: [
    { name: "Anusha", holds: "THE QUESTION" },
    { name: "Sizwe", holds: "START DATE" },
    { name: "Lerato", holds: "PRICE" },
    { name: "Mr Jacobs", holds: "MATERIAL" },
  ],
  shots: [
    {
      id: "1", kind: "slate", start: 0, end: 3.5, tone: "cool", chain: 0,
      slug: "INT. PROPERTY OFFICE — 17:55",
      frame: "Medium close-up · 50mm · locked off · facing screen-right",
      action: "Anusha at her desk, desk phone on speaker. A competitor's quote beside her notepad. She looks from the phone up to the wall clock.",
      sound: "Hold tune, already playing, thin from the speakerphone. Air-conditioning.",
      method: "GENERATED",
    },
    {
      id: "2", kind: "slate", start: 3.5, end: 5.0, tone: "cool", chain: 0,
      slug: "INSERT — HER NOTEPAD",
      frame: "Top-down macro · locked off",
      action: "Mokoena W/proofing. Price ____  Material ____  Start ____. Her pen taps the first blank.",
      sound: "Tune continues. Pen tap.",
      method: "FILMED TABLETOP INSERT",
    },
    {
      id: "3", kind: "slate", start: 5.0, end: 8.5, tone: "warm", chain: 1,
      slug: "EXT. FLAT ROOF, SANDTON — LOW SUN",
      frame: "Medium · 50mm · very slow push-in · facing screen-right",
      action: "Sizwe, phone at his ear, pocket diary open in his other hand. Behind him, soft, two crew torch a seam. He is also on hold.",
      sound: "The same tune, same bar, tiny through a handset. Wind. Gas torch.",
      method: "GENERATED",
    },
    {
      id: "4", kind: "slate", start: 8.5, end: 10.0, tone: "warm", chain: 1,
      slug: "INSERT — HIS DIARY",
      frame: "Macro · locked off",
      action: "Pencilled crews and dates. He underlines: Mon 4 — Thabo.",
      sound: "Tune. Pencil on paper.",
      method: "FILMED TABLETOP INSERT",
    },
    {
      id: "5", kind: "slate", start: 10.0, end: 14.0, tone: "neutral", chain: 2,
      slug: "INT. CONTRACTOR'S OFFICE — LATE AFTERNOON",
      frame: "Medium · 50mm · locked off · facing screen-right",
      action: "Lerato, receiver at her ear, a hold light blinking on the desk phone. She writes a figure on a sticky note and presses it to the monitor's edge beside six others.",
      sound: "No tune now. Inside her receiver: a man counting, small and distant. Fluorescent hum.",
      method: "FILMED",
    },
    {
      id: "6", kind: "slate", start: 14.0, end: 18.0, tone: "store", chain: 3,
      slug: "INT. STOREROOM — LATE AFTERNOON",
      frame: "Medium-wide · 35mm · locked off · looking down",
      action: "Mr Jacobs among racked drums. A mobile on a drum lid, on speaker. He touches each drum and ticks its lid with a marker.",
      sound: "The same counting, now full and in the room. Marker. A fridge.",
      method: "GENERATED (fallback: filmed)",
    },
    {
      id: "7", kind: "slate", start: 18.0, end: 22.0, tone: "cool", chain: 0,
      slug: "INT. PROPERTY OFFICE — 17:58",
      frame: "As shot 1 · locked off",
      action: "She looks to the door, then the clock. She presses a key, picks up the competitor's quote and leaves. Hold on the empty desk and the notepad: three blanks.",
      sound: "Key press. The tune stops mid-phrase, unresolved. Room tone. Footsteps away.",
      method: "GENERATED",
    },
    {
      id: "8", kind: "slate", start: 22.0, end: 28.5, tone: "warm", chain: 1,
      slug: "EXT. ROOF — CLOSE ON SIZWE",
      frame: "Close-up · 85mm · three-quarter · gentle handheld drift",
      action: "He listens, nods, taps to switch calls. Waits. Looks at the phone. Puts it back to his ear.",
      sound: "Wind. No tune.",
      method: "GENERATED",
    },
    {
      id: "9", kind: "slate", start: 28.5, end: 30.0, tone: "morning",
      slug: "INT. CONTRACTOR'S OFFICE — ANOTHER MORNING",
      frame: "Medium · 50mm · locked off",
      action: "Lerato sits, mug in hand. The monitor's edge is bare: no sticky notes. The desk phone rings. She lifts the receiver.",
      sound: "Morning birds. Phone rings.",
      method: "FILMED",
    },
    {
      id: "10", kind: "slate", start: 30.0, end: 31.5, tone: "morning",
      slug: "INSERT — THE HOLD KEY",
      frame: "Macro · locked off",
      action: "Her finger travels to the HOLD key, stops a centimetre above it, and withdraws.",
      sound: "Caller's voice in the receiver. No music.",
      method: "FILMED",
    },
    {
      id: "11", kind: "plate", start: 31.5, end: 33.5,
      src: S + "enquiries-filtered.png",
      note: "FILMED OVER HER SHOULDER, LIVE SCREEN",
    },
    { id: "12", kind: "screen", start: 33.5, end: 35.0, src: S + "insert-grand-total.png" },
    { id: "13", kind: "screen", start: 35.0, end: 36.5, src: S + "insert-stock.png" },
    { id: "14", kind: "screen", start: 36.5, end: 37.8, src: S + "insert-booking.png" },
    {
      id: "15", kind: "slate", start: 37.8, end: 39.2, tone: "warm",
      slug: "EXT. ROOF — ANOTHER DAY",
      frame: "Medium · 50mm · locked off · from behind",
      action: "Sizwe on his knees with his crew, pressing a seam. His phone is in his back pocket. It does not ring.",
      sound: "Wind. A roller.",
      method: "GENERATED",
    },
    {
      id: "16", kind: "slate", start: 39.2, end: 41.5, tone: "morning",
      slug: "INT. CONTRACTOR'S OFFICE — LERATO",
      frame: "Medium close-up · 50mm · locked off · lit by the screen",
      action: "She listens. She answers, already reaching for her mug.",
      sound: "A beat of quiet before his line.",
      method: "FILMED",
    },
    {
      id: "17", kind: "endcard", start: 41.5, end: 45,
      card: { line: "Know where every job stands.", cta: "Start your free trial", url: "managem.co.za", ctaAt: 1.5 },
    },
  ],
  lines: [
    { start: 16.0, end: 17.7, who: "Mr Jacobs", text: "…twenty-six. Twenty-seven.", via: "on-camera" },
    { start: 18.3, end: 19.7, who: "Colleague", text: "They're ready for you.", via: "off-camera" },
    { start: 22.3, end: 24.5, who: "Lerato", text: "Two-fourteen, six hundred. And the membrane's in.", via: "phone" },
    { start: 24.7, end: 25.4, who: "Sizwe", text: "Mrs Pillay?", via: "on-camera" },
    { start: 25.8, end: 26.4, who: "Sizwe", text: "…Hello?", via: "on-camera" },
    { start: 26.7, end: 27.4, who: "Sizwe", text: "Thanks, Lerato.", via: "on-camera" },
    { start: 27.4, end: 29.3, who: "Voice", text: "The job goes to whoever answers first.", via: "voiceover" },
    { start: 30.2, end: 31.5, who: "Caller", text: "Morning. MST Group. Trustees meet tonight…", via: "phone" },
    { start: 31.5, end: 33.4, who: "Caller", text: "…price, material, start date?", via: "phone" },
    { start: 33.6, end: 35.0, who: "Lerato", text: "One sixty-six, three-thirteen.", via: "on-camera" },
    { start: 35.1, end: 36.5, who: "Lerato", text: "Forty-two drums in the store.", via: "on-camera" },
    { start: 36.6, end: 39.0, who: "Lerato", text: "Michael's team, the first of May.", via: "on-camera" },
    { start: 39.5, end: 40.6, who: "Caller", text: "…You don't need to check?", via: "phone" },
    { start: 40.8, end: 41.5, who: "Lerato", text: "I just did.", via: "on-camera" },
    { start: 41.9, end: 44.3, who: "Voice", text: "ManaGEM. Know where every job stands.", via: "voiceover" },
  ],
  cues: [
    // --- Thursday, 17:55 ---
    { src: A + "amb-property-office.wav", start: 0, end: 5.0, volume: 0.55 },
    { src: A + "tune-speakerphone.wav", start: 0, end: 5.0, volume: 0.6, lockToTimeline: TUNE },
    { src: A + "sfx-pen-tap.wav", start: 4.3, volume: 0.9 },
    { src: A + "amb-roof.wav", start: 5.0, end: 10.0, volume: 0.6 },
    { src: A + "tune-handset.wav", start: 5.0, end: 10.0, volume: 0.5, lockToTimeline: TUNE },
    { src: A + "sfx-pencil.wav", start: 9.0, volume: 0.9 },
    { src: A + "amb-contractor-office.wav", start: 10.0, end: 14.0, volume: 0.7 },
    { src: A + "sfx-count-phone.wav", start: 10.0, end: 14.0, volume: 0.8, lockToTimeline: COUNT },
    { src: A + "amb-storeroom.wav", start: 14.0, end: 18.0, volume: 0.7 },
    { src: A + "sfx-count-room.wav", start: 14.0, end: 18.0, volume: 0.9, lockToTimeline: COUNT },
    { src: A + "amb-property-office.wav", start: 18.0, end: 22.0, volume: 0.55 },
    { src: A + "tune-speakerphone.wav", start: 18.0, end: 20.3, volume: 0.6, lockToTimeline: TUNE },
    { src: A + "sfx-key-press.wav", start: 20.24, volume: 0.9 },
    { src: A + "sfx-chair-footsteps.wav", start: 20.7, volume: 0.8 },
    { src: A + "amb-roof-wind-only.wav", start: 22.0, end: 28.5, volume: 0.8 },
    // --- another morning ---
    { src: A + "amb-morning-office.wav", start: 28.5, end: 37.8, volume: 0.8 },
    { src: A + "sfx-desk-phone-ring.wav", start: 29.35, end: 30.0, volume: 0.7 },
    { src: A + "sfx-typing.wav", start: 31.7, volume: 0.8 },
    { src: A + "sfx-mouse-click.wav", start: 33.1, volume: 0.9 },
    { src: A + "sfx-mouse-click.wav", start: 34.94, volume: 0.9 },
    { src: A + "sfx-mouse-click.wav", start: 36.44, volume: 0.9 },
    { src: A + "amb-roof-wind-only.wav", start: 37.8, end: 39.2, volume: 0.6, offset: 2 },
    { src: A + "amb-morning-office.wav", start: 39.2, end: 41.5, volume: 0.8, offset: 9.3 },
    { src: A + "sting-resolved.wav", start: 41.6, volume: 0.9 },
  ],
};

// The three product inserts on their own, clean, at the scripted durations.
// Nothing is drawn over them. This is the legibility test.
export const productInserts: FilmSpec = {
  title: "Please Hold — product inserts",
  version: "v1",
  fps: 25,
  width: 1920,
  height: 1080,
  duration: 4.3,
  shots: [
    { id: "12", kind: "screen", start: 0, end: 1.5, src: S + "insert-grand-total.png" },
    { id: "13", kind: "screen", start: 1.5, end: 3.0, src: S + "insert-stock.png" },
    { id: "14", kind: "screen", start: 3.0, end: 4.3, src: S + "insert-booking.png" },
  ],
  lines: [],
  cues: [
    { src: A + "sfx-mouse-click.wav", start: 1.44, volume: 0.9 },
    { src: A + "sfx-mouse-click.wav", start: 2.94, volume: 0.9 },
  ],
};
