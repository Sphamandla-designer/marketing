# ManaGEM — 3D product advert

`ManaGEM-advert-1080p.mp4` — 43 s, 1920×1080, 30 fps, with soundtrack.

Built in the style of the reference adverts in the repo root (the SaaS
motion-graphics set: Zelios, IOMI, Taskip, Flowz, Axiom, FinFlow), using the
real ManaGEM screens, logo, font (Outfit) and brand colours (navy, teal, sky).

## Storyboard

| Time | Scene | On-screen copy |
| --- | --- | --- |
| 0:00 | Hook, kinetic type + sparkle | Running a business / shouldn't feel like **chaos.** |
| 0:03 | Problem, orbiting tool chips | Too many **tools.** Spreadsheets. Paper. Chat groups. Guesswork. |
| 0:08 | Brand reveal, typed tagline pill | Meet → ManaGEM — Know what's making you money. |
| 0:11 | 3D dashboard fly-in, KPI cards lift off | Your whole business. **One view.** / Enquiries. Quotes. Sales. **Live.** |
| 0:17 | Sidebar in 3D, word roll | Handle Customers / Sales / Projects / Stock / Factory / Debtors / everything **in one place.** |
| 0:22 | Feature beats with cursor click | Track every **enquiry.** · Invoice in **seconds.** · Keep every project **on track.** |
| 0:29 | Three screens fanned in 3D | Stock. Factory. Debtors. All **connected.** |
| 0:33 | Bright statement cards | Less admin. Better decisions. More **profit.** |
| 0:37 | Logo outro + CTA click | Know what's making you **money.** — Book a demo |

## Re-rendering

`source/ad.html` is the whole animation: one `render(t)` function drives every
frame, so edits to copy or timing are plain text changes.

    cd source
    node render.js "$PWD" silent.mp4      # needs Playwright + ffmpeg
    python3 audio.py                      # writes music.wav (needs numpy)
    ffmpeg -i silent.mp4 -i music.wav -c:v copy -c:a aac -b:a 192k -shortest out.mp4

The soundtrack is synthesised by `audio.py`, so it is original and free to use.
