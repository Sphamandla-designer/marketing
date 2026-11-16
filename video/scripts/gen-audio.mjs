// Synthesises every sound in the "Please Hold" animatic as 16-bit mono WAV.
// No downloads, no samples, no paid services: sine, square, noise and filters.
// These are scratch sounds for timing. The final film uses a composed tune,
// recorded voices and real foley.
//
// Usage: node scripts/gen-audio.mjs public/films/please-hold/audio
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'public/films/please-hold/audio';
mkdirSync(OUT, { recursive: true });
const SR = 44100;

// ---------- helpers ----------
const buf = (sec) => new Float32Array(Math.round(sec * SR));
let seed = 1234567;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296 - 0.5;
};
const writeWav = (name, data, gain = 1) => {
  const n = data.length;
  const out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + n * 2, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, data[i] * gain));
    out.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(`${OUT}/${name}`, out);
};
const normalise = (d, peak = 0.9) => {
  let m = 0;
  for (const v of d) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < d.length; i++) d[i] = (d[i] / m) * peak;
  return d;
};
// RBJ biquad
const biquad = (d, type, f, q = 0.707) => {
  const w = (2 * Math.PI * f) / SR;
  const a = Math.sin(w) / (2 * q);
  const c = Math.cos(w);
  let b0, b1, b2;
  if (type === 'lp') [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
  else if (type === 'hp') [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
  else [b0, b1, b2] = [a, 0, -a]; // bp
  const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  const o = new Float32Array(d.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < d.length; i++) {
    const x = d[i];
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    o[i] = y;
  }
  return o;
};
const fade = (d, inSec = 0.01, outSec = 0.01) => {
  const a = Math.round(inSec * SR), b = Math.round(outSec * SR);
  for (let i = 0; i < a && i < d.length; i++) d[i] *= i / a;
  for (let i = 0; i < b && i < d.length; i++) d[d.length - 1 - i] *= i / b;
  return d;
};
const mixInto = (dst, src, atSec, gain = 1) => {
  const o = Math.round(atSec * SR);
  for (let i = 0; i < src.length && o + i < dst.length; i++) if (o + i >= 0) dst[o + i] += src[i] * gain;
};
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// ---------- the hold tune ----------
// Eight bars in C, deliberately a little cheap. The phrase climbs towards the
// tonic through bars 5-6, so wherever it is cut in that stretch it stops
// unresolved. The end sting plays the same shape and lands on C.
const BPM = 104;
const BEAT = 60 / BPM;
const EIGHTH = BEAT / 2;
// [midi note or null, length in eighths]
const MELODY = [
  [72, 2], [76, 2], [79, 2], [76, 2],          // bar 1  C E G E
  [74, 2], [77, 2], [81, 3], [79, 1],          // bar 2  D F A G
  [76, 2], [79, 2], [84, 2], [79, 2],          // bar 3  E G C' G
  [77, 2], [76, 2], [74, 4],                   // bar 4  F E D—
  [72, 2], [74, 2], [76, 2], [77, 2],          // bar 5  C D E F  (climbing)
  [79, 2], [81, 2], [83, 4],                   // bar 6  G A B—   (leading note)
  [84, 2], [79, 2], [76, 2], [79, 2],          // bar 7  C' G E G
  [77, 2], [74, 2], [72, 4],                   // bar 8  F D C—
];
const BASS = [48, 53, 48, 55, 45, 55, 48, 55]; // one per bar

const epiano = (midi, sec) => {
  const d = buf(sec);
  const f = hz(midi);
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 3.2) * Math.min(1, t / 0.004);
    const mod = Math.sin(2 * Math.PI * f * 2 * t) * 1.4 * Math.exp(-t * 6);
    d[i] = Math.sin(2 * Math.PI * f * t + mod) * env + 0.25 * Math.sin(2 * Math.PI * f * 2 * t) * env;
  }
  return fade(d, 0.002, 0.03);
};
const softBass = (midi, sec) => {
  const d = buf(sec);
  const f = hz(midi);
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 1.2);
    d[i] = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t)) * env;
  }
  return fade(d, 0.005, 0.05);
};

const LOOP_SEC = 8 * 4 * BEAT;
const renderTune = (loops) => {
  const d = buf(LOOP_SEC * loops + 1);
  for (let l = 0; l < loops; l++) {
    let pos = l * LOOP_SEC;
    for (const [note, len] of MELODY) {
      if (note !== null) mixInto(d, epiano(note, len * EIGHTH + 0.25), pos, 0.5);
      pos += len * EIGHTH;
    }
    BASS.forEach((n, bar) => {
      const at = l * LOOP_SEC + bar * 4 * BEAT;
      mixInto(d, softBass(n, 2 * BEAT), at, 0.35);
      mixInto(d, softBass(n + 7, 2 * BEAT), at + 2 * BEAT, 0.28);
    });
  }
  return d;
};

const tune = normalise(renderTune(2), 0.8);
writeWav('tune-dry.wav', tune);
// Desk speakerphone: narrow band, slightly driven.
let spk = biquad(biquad(tune, 'hp', 420), 'lp', 3300);
spk = spk.map((v) => Math.tanh(v * 2.2));
writeWav('tune-speakerphone.wav', normalise(spk, 0.75));
// Mobile handset held to an ear, heard from outside: narrower and thinner.
let hs = biquad(biquad(biquad(tune, 'hp', 900), 'hp', 900), 'lp', 2600);
writeWav('tune-handset.wav', normalise(hs, 0.6));

// ---------- end sting: the phrase, resolved, by a small "band" ----------
const pluck = (midi, sec) => {
  // Karplus-Strong string
  const f = hz(midi);
  const N = Math.round(SR / f);
  const line = new Float32Array(N).map(() => rnd() * 2);
  const d = buf(sec);
  let idx = 0;
  for (let i = 0; i < d.length; i++) {
    const nxt = (idx + 1) % N;
    const v = (line[idx] + line[nxt]) * 0.4985;
    d[i] = line[idx];
    line[idx] = v;
    idx = nxt;
  }
  return fade(biquad(d, 'lp', 4200), 0.001, 0.3);
};
const brush = (sec) => {
  const d = buf(sec);
  for (let i = 0; i < d.length; i++) d[i] = rnd() * Math.exp(-(i / SR) * 14);
  return biquad(biquad(d, 'hp', 3000), 'lp', 9000);
};
{
  const d = buf(3.6);
  const step = 0.2;
  // G A B C — the climb from bars 5-6, finishing on the tonic it never reached.
  [[67, 0], [69, 1], [71, 2], [72, 3.2]].forEach(([n, s], i) => {
    mixInto(d, pluck(n, i === 3 ? 2.8 : 0.9), 0.05 + s * step, i === 3 ? 0.9 : 0.6);
  });
  // final chord: C E G under the last note
  [[60, 0], [64, 0.02], [67, 0.04]].forEach(([n, o]) => mixInto(d, pluck(n, 2.8), 0.05 + 3.2 * step + o, 0.45));
  mixInto(d, softBass(43, 0.6), 0.05, 0.5);
  mixInto(d, softBass(36, 2.6), 0.05 + 3.2 * step, 0.7);
  [0, 1, 2, 3.2].forEach((s) => mixInto(d, brush(0.25), 0.05 + s * step, 0.12));
  writeWav('sting-resolved.wav', fade(normalise(d, 0.85), 0.002, 0.6));
}

// ---------- ambiences (loopable beds) ----------
const noiseBed = (sec, chain) => {
  let d = buf(sec);
  for (let i = 0; i < d.length; i++) d[i] = rnd();
  for (const [t, f, q] of chain) d = biquad(d, t, f, q);
  return d;
};
const hum = (sec, base, partials) => {
  const d = buf(sec);
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    let v = 0;
    partials.forEach(([mult, g]) => (v += g * Math.sin(2 * Math.PI * base * mult * t)));
    d[i] = v;
  }
  return d;
};
const add = (a, b, g = 1) => a.map((v, i) => v + (b[i] ?? 0) * g);

// Property office: air-conditioning.
writeWav('amb-property-office.wav', fade(normalise(add(noiseBed(8, [['lp', 700], ['hp', 90]]), hum(8, 60, [[1, 0.05], [2, 0.03]]), 1), 0.22), 0.3, 0.3));
// Roof: wind with slow gusts, plus a gas torch hiss.
{
  let w = noiseBed(10, [['lp', 520], ['hp', 60]]);
  w = w.map((v, i) => v * (0.55 + 0.45 * Math.sin((2 * Math.PI * i) / SR / 3.7) * Math.sin((2 * Math.PI * i) / SR / 1.9)));
  const torch = noiseBed(10, [['bp', 2400, 0.6], ['hp', 1200]]);
  writeWav('amb-roof.wav', fade(normalise(add(w, torch, 0.25), 0.5), 0.3, 0.3));
  let w2 = noiseBed(9, [['lp', 480], ['hp', 60]]);
  w2 = w2.map((v, i) => v * (0.6 + 0.4 * Math.sin((2 * Math.PI * i) / SR / 2.9)));
  writeWav('amb-roof-wind-only.wav', fade(normalise(w2, 0.4), 0.2, 0.3));
}
// Contractor's office, afternoon: fluorescent hum.
writeWav('amb-contractor-office.wav', fade(normalise(add(hum(8, 100, [[1, 0.5], [2, 0.3], [3, 0.12], [5, 0.05]]), noiseBed(8, [['lp', 900]]), 0.5), 0.14), 0.3, 0.3));
// Storeroom: a fridge compressor and a little air.
writeWav('amb-storeroom.wav', fade(normalise(add(hum(8, 50, [[1, 0.6], [2, 0.25], [4, 0.08]]), noiseBed(8, [['lp', 600]]), 0.7), 0.16), 0.3, 0.3));
// Contractor's office, morning: quiet room with a few birds outside.
{
  const d = noiseBed(14, [['lp', 500]]).map((v) => v * 0.3);
  const chirp = (f0, f1, sec) => {
    const c = buf(sec);
    for (let i = 0; i < c.length; i++) {
      const t = i / SR, k = t / sec;
      c[i] = Math.sin(2 * Math.PI * (f0 + (f1 - f0) * k) * t) * Math.sin(Math.PI * k) ** 2;
    }
    return c;
  };
  [[0.4, 3200, 4100], [0.55, 3600, 3000], [0.7, 3300, 4300], [3.1, 2800, 3700], [3.3, 3900, 3100], [6.2, 3400, 4200], [6.35, 3500, 2900], [9.4, 3000, 3900], [9.6, 4000, 3200], [12.0, 3300, 4100]]
    .forEach(([at, a, b]) => mixInto(d, chirp(a, b, 0.09), at, 0.18));
  writeWav('amb-morning-office.wav', fade(normalise(d, 0.2), 0.3, 0.3));
}

// ---------- spot effects ----------
const click = (f, decay, sec = 0.06) => {
  const d = buf(sec);
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    d[i] = (rnd() * 0.7 + Math.sin(2 * Math.PI * f * t) * 0.6) * Math.exp(-t * decay);
  }
  return d;
};
writeWav('sfx-mouse-click.wav', normalise(biquad(click(2400, 180), 'hp', 900), 0.7));
writeWav('sfx-pen-tap.wav', normalise(biquad(click(700, 90, 0.09), 'lp', 2500), 0.6));
writeWav('sfx-key-press.wav', normalise(add(biquad(click(1500, 120, 0.12), 'hp', 500), (() => {
  const d = buf(0.12);
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    d[i] = 0.5 * (Math.sin(2 * Math.PI * 941 * t) + Math.sin(2 * Math.PI * 1336 * t)) * Math.min(1, t / 0.005) * Math.exp(-t * 12);
  }
  return d;
})(), 0.5), 0.7));
// Pencil underline: a short scratch.
{
  let d = buf(0.55);
  for (let i = 0; i < d.length; i++) {
    const k = i / d.length;
    d[i] = rnd() * Math.sin(Math.PI * k) * (0.7 + 0.3 * Math.sin(k * 90));
  }
  writeWav('sfx-pencil.wav', normalise(biquad(biquad(d, 'hp', 2500), 'lp', 7000), 0.35));
}
// Marker tick on a drum lid: a squeak and a knock. Used as the "count".
const markerTick = () => {
  const d = buf(0.22);
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    const squeak = Math.sin(2 * Math.PI * (1800 + 900 * Math.sin(t * 40)) * t) * Math.exp(-t * 22) * 0.35;
    const knock = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 45) * 0.9;
    d[i] = squeak + knock + rnd() * 0.15 * Math.exp(-t * 60);
  }
  return d;
};
{
  // A steady count: one tick every 0.95 s, for 10 s.
  const d = buf(10);
  for (let t = 0.15; t < 10; t += 0.95) mixInto(d, markerTick(), t, 1);
  writeWav('sfx-count-room.wav', normalise(d, 0.75));
  // The same count heard down a phone line.
  const p = biquad(biquad(biquad(d, 'hp', 700), 'hp', 700), 'lp', 2800).map((v) => Math.tanh(v * 3));
  writeWav('sfx-count-phone.wav', normalise(p, 0.4));
}
// Desk phone ring: two bursts of a two-tone warble.
{
  const d = buf(1.3);
  const burst = (at) => {
    for (let i = 0; i < 0.4 * SR; i++) {
      const t = i / SR;
      const f = Math.floor(t * 25) % 2 ? 480 : 620;
      const j = Math.round(at * SR) + i;
      if (j < d.length) d[j] += Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.01) * Math.min(1, (0.4 - t) / 0.02);
    }
  };
  burst(0.02);
  burst(0.62);
  writeWav('sfx-desk-phone-ring.wav', normalise(biquad(d, 'bp', 1500, 0.5), 0.6));
}
// A few keystrokes.
{
  const d = buf(1.4);
  [0.05, 0.22, 0.36, 0.55, 0.7, 0.88].forEach((at) => mixInto(d, biquad(click(1100 + rnd() * 300, 150), 'hp', 600), at, 0.8));
  writeWav('sfx-typing.wav', normalise(d, 0.5));
}
// Chair and footsteps leaving a carpeted office.
{
  const d = buf(1.6);
  mixInto(d, biquad(noiseBed(0.3, [['lp', 900]]).map((v, i, a) => v * Math.sin((Math.PI * i) / a.length)), 'hp', 150), 0.0, 0.8);
  [0.55, 0.9, 1.22].forEach((at, i) => mixInto(d, biquad(click(120, 40, 0.14), 'lp', 600), at, 0.9 - i * 0.22));
  writeWav('sfx-chair-footsteps.wav', normalise(d, 0.45));
}

console.log('audio written to', OUT, '| tune loop', LOOP_SEC.toFixed(2), 's');
