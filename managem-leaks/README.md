# ManaGEM — "LEAKS" advert (Pain Point #3)

`ManaGEM-LEAKS-45s-16x9.mp4` is the 45-second desktop (1920×1080) hero cut and
`ManaGEM-LEAKS-45s-9x16.mp4` is the vertical social version, both built from the
"LEAKS" script and the avatar sheet (`WhatsApp Image 2026-11-20 at 14.14.25.jpeg`).

## What this cut is — and is not

This is a **v1 animated cut**, not yet the fully AI-animated film.

- The roofer avatar is the hero ("the Contractor"), the purple gem is ManaGEM,
  and the whole crew closes the film on the end card.
- Three frames are AI-generated 3D stills in the avatar style (`stills/`):
  hands sealing the crack, the roofer on the Joburg rooftop, the bakkie at dusk.
- Character motion is cut-out animation (walk-in, bounce, turn, stomp). There
  is **no lip-sync, no true walk cycle and no facial animation** — that needs an
  image-to-video model, and none of the connected accounts could run one
  (Kling: 0 credits; Higgsfield: 0.02 credits; ElevenLabs free plan: video
  blocked, images capped at 3 per day).
- The office / leak / flood act is motion graphics, not generated footage.
- The product beat uses real screenshots of the prototype (`ManaGEM (5).html`,
  SBS Waterproofing demo data): Debtors Management, Customer Receipts,
  Products & Pricing, Warranties. No figures were edited.
- Voice-over: ElevenLabs, voice "ZanB October 2026" (South African English).
  Music and sound effects are synthesised in `src/audio.py`.

## Differences from the script

| Script | This cut | Why |
| --- | --- | --- |
| Faceless male contractor | The roofer avatar, face visible | Brief asked for the uploaded avatars |
| "Send Reminder" click | Row menu showing View Account / Log Interaction / Send Statement | That is what the prototype shows |
| Product margin bars, 4% flagged red | Price and cost columns, MB-104 highlighted | No margin bars in the prototype |
| End card URL | "Book a demo", no URL | URL still an open question in the script |

## Finishing it with real character animation

Each still in `stills/` (vertical) and `stills/16x9/` (desktop) is a ready start frame for image-to-video. Suggested
motion prompts:

1. `s01.png` — "Gloved hands push the roller forward along the crack, wet
   membrane spreading, slow push-in, golden hour."
2. `s02.png` — "She walks two steps toward camera, smiles and says the line,
   then crouches and raps the sealed patch twice with her knuckles. Low angle,
   steady." Line: *"Give me any roof in Joburg… and I'll find the leak."*
3. `s03.png` — "The bakkie drives away down the street, streetlights flicker on
   one by one, static wide shot."

Eight more scene frames (office, drips, buckets, flood, laptop reveal with the
gem, dawn office, sunrise rooftop) are queued with full prompts in the
ElevenLabs flow "ManaGEM LEAKS ad" and have not been generated.

Generated clips drop straight into the timeline in `src/ad.html` (`scene()`
holds the cut points; `CAPS` holds the subtitle timings).

## Re-rendering

```bash
cd src
ffmpeg -i voiceover.mp3 -ar 44100 -ac 1 vo.wav
python3 audio.py                 # writes audio.wav (needs numpy, scipy)
mkdir frames && node render169.js frames   # desktop; render.js for vertical (needs playwright)
ffmpeg -framerate 30 -i frames/f%05d.jpg -i audio.wav -c:v libx264 -pix_fmt yuv420p -crf 17 -c:a aac -b:a 192k out.mp4
```
