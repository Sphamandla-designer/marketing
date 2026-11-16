# Campaign video toolkit

A small Remotion project for the parts of a commercial that are built, not shot:
end cards, product-screen inserts and timed animatics. First used for the ManaGEM
film "Please Hold". Built to be reused for other campaigns.

## What it renders

| Composition | What it is | Length |
| --- | --- | --- |
| `PleaseHold-Animatic-45` | The 45-second master as a timed animatic: text boards for shots not yet made, real product screens, the real end card, scratch sound and dialogue subtitles | 45 s |
| `PleaseHold-EndCard` | The end card on its own | 3.5 s |
| `PleaseHold-ProductInserts` | The three product inserts, clean, at scripted durations. Nothing drawn over them | 4.3 s |

All are 1920 × 1080 at 25 fps.

## Commands

```bash
npm install
```

```bash
npm run audio
```

```bash
npm run render
```

```bash
npm run studio
```

`npm run screens -- <path-to-managem-app.html>` recaptures the product screens.

Rendering uses a browser already on the machine when it finds one (see
`remotion.config.ts`). Set `REMOTION_BROWSER` to point at another.

## How it is organised

```
src/
  core/         brand type, film type, motion constants, font loader, time helpers
  brands/       one file per brand
  components/   EndCard, ScreenInsert, Slate, Subtitles, BrandField, Film
  films/        one folder per film; the film is data
public/
  fonts/        self-hosted fonts
  brands/       logos, by brand
  films/        screens and audio, by film
scripts/        screen capture and sound synthesis
```

## Starting a new campaign

1. **Add the brand.** Copy `src/brands/managem.ts`, change the colours, fonts and
   logo, and put the files under `public/`. Nothing else knows about a brand's
   colours.
2. **Write the film as data.** Copy `src/films/please-hold/spec.ts`. A film is a list
   of shots, dialogue lines and sound cues, all timed in seconds. Shot kinds:
   - `slate`: a text board for a shot that does not exist yet
   - `screen`: a real product screen, shown untouched
   - `plate`: a real image standing in for a shot that will be filmed
   - `endcard`: the brand end card
3. **Register it** in `src/Root.tsx`.

The end card takes a brand, a line, a call to action and an address, and works for
any brand without changes.

## Rules this project keeps

- **Product screens are never altered.** `ScreenInsert` draws the capture at native
  size with no movement, grade, grain, mask or fade. Captures are made at exactly
  1920 × 1080 so no scaling happens. To change how a screen looks, change the
  capture.
- **Guides never touch a clean pass.** Timecode, shot labels and subtitles appear
  only when `guides` is on, and the timecode never sits over a product screen.
- **All timing is in seconds.** Frames are derived from the film's frame rate.
- **All colour, type and easing comes from the brand and `core/motion.ts`.**

## What is temporary

- **Sound.** Every sound is synthesised by `scripts/gen-audio.mjs` from sine waves
  and noise. They are scratch sounds for judging timing. The film needs a composed
  hold tune, recorded voices and real foley.
- **Dialogue.** Shown as subtitles; there are no voices.
- **Product data.** The screens are the ManaGEM prototype's own example data, and
  the spoken figures in the animatic follow them. Names on those screens are not
  cleared for broadcast.

## Licence note on Remotion

Remotion is free for individuals, for companies with up to three employees, for
non-profits, and for evaluation. A larger for-profit company needs a paid company
licence before using it commercially. Check `node_modules/remotion/LICENSE.md` and
remotion.dev against who will own the finished videos before any of these renders
are used in a paid campaign.

Fonts (Outfit, IBM Plex Mono) are under the SIL Open Font License.
