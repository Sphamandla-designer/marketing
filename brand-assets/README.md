# AX-Channels — brand asset kit

Graphic design assets built from the supplied AX-Channels logo artwork. Every
file here is a PNG, generated from the templates in `tools/brand/`.

Start with **`00-kit-overview.png`** — a single contact sheet of everything below.

---

## Before you publish anything

The copy in these files uses **placeholder contact details and placeholder
claims**. Swap them before anything goes out:

| Placeholder | Where it appears |
| --- | --- |
| `www.axchannels.co.za` | Almost every asset |
| `hello@axchannels.co.za` | Social CTAs, stationery, poster, slides |
| `+27 00 000 0000` | Stationery, one-pager, poster |
| `Full Name` / `Role / Title` | Business card, letterhead, email signature |
| `[Client name]`, `[Date]`, `[Role, Company]` | Letterhead, title slide, one-pager quote |
| "12 weeks", "6 audits a month", the testimonial | One-pager and poster — these are **invented examples**, not facts |

They all live in one place: `tools/brand/system.py` (and `NAME`/`ROLE` in
`tools/brand/assets_stationery.py`). Change them there and re-run the build.

---

## What's in here

### `logo/` — the logo kit (42 files)

The supplied artwork, trimmed of its transparent padding and named for what it
is, plus the colourways and icon sizes derived from it.

| File | Use |
| --- | --- |
| `ax-logo-primary-on-light.png` | **The default.** Mark + wordmark, black and magenta, for white or light backgrounds |
| `ax-logo-white-on-dark.png` | The default reversed, for ink or photographic backgrounds |
| `ax-lockup-tagline-primary-on-light.png` | Full lockup with the tagline — covers, banners, first impressions |
| `ax-lockup-tagline-white-on-dark.png` | The same, reversed |
| `ax-mark-primary-on-light.png` / `ax-mark-white-on-dark.png` | Mark only — small squares, avatars, favicons |
| `ax-*-mono-black.png` / `ax-*-mono-white.png` | One-colour versions for embroidery, etching, single-colour print |
| `ax-*-magenta.png` | One-colour magenta, for pale backgrounds only |
| `icons/app-icon-*.png` | 1024 / 512 / 256px app icons — black, magenta, white and rounded |
| `icons/avatar-round-*.png`, `avatar-square-*.png` | Profile pictures |
| `icons/favicon-*.png` | 16 → 512px favicons |

### `guidelines/` — four A4 landscape reference sheets (2480×1754)

`01-logo-system` · `02-colour` · `03-typography` · `04-clear-space-and-misuse`.
Send these to anyone who will ever place the logo — printers, developers,
partners, a freelancer building a deck.

### `social/` — 14 channel-ready graphics

Headers (LinkedIn personal + company, X, Facebook, YouTube), five Instagram
squares, two stories, two LinkedIn link cards. Sizes are in the filenames.
Each layout respects the platform's own overlays: profile pictures, centre
crops, and the 250px top/bottom sticker-safe band on stories.

### `presentation/` — six 1920×1080 frames

Title, section divider, content, timeline, closing, plus a video-call
background whose centre is deliberately left empty for the speaker.

### `collateral/` — three larger pieces

`web-hero-1920x960` (homepage hero, also works as an OG/link-preview image),
`one-pager-a4-capability` (leave-behind), `poster-a4-offer` (lead-magnet promo).

### `stationery/` — print files at 300 dpi

| File | Notes |
| --- | --- |
| `business-card-{front,back}-print-1124x674.png` | 3.5 × 2in **with 1/8in (3.18mm) bleed on all four edges**. Trim sits 37px inside; keep text 75px or more off the trim |
| `letterhead-a4-{blank,example}-2480x3508.png` | A4 at 300 dpi. The `example` file shows the intended margins and type sizes |
| `email-signature-600x170@2x.png` | Retina file — **insert at 600 × 170** so it stays sharp |

### `ads/` — seven IAB display sizes

300×250, 336×280, 300×600, 160×600, 728×90, 970×250, 320×50. Rendered at exact
pixel size, no scaling needed.

---

## The design language, in short

- **Ink `#0C0C0C`, magenta `#D62F6C`, white.** Roughly 60 / 30 / 10 — magenta
  works because it's rare.
- **Every diagonal is cut at 51.6°**, the angle measured off the logo's own X
  stroke. The stripe texture, the accent strokes and the corner wedges all
  share it, which is why the graphics feel related to the mark.
- **Poppins** for display type (it matches the wordmark's lettering),
  **Inter** for everything else. Both are open source — see
  `tools/brand/fonts/NOTICE.md`.
- The mark, screened back to 5-10% and bled off an edge, is the standard
  background graphic. It is never a decoration *inside* the layout.

---

## Regenerating or editing

```bash
python3 tools/brand/prep_logos.py                 # rebuild logo/ from the source artwork
python3 tools/brand/build.py                      # rebuild every PNG
python3 tools/brand/build.py social ads           # or just some sections
python3 tools/brand/contact_sheet.py              # rebuild 00-kit-overview.png
```

Requires Python with Pillow, and Node with Playwright + Chromium (the pages are
laid out in HTML/CSS and screenshotted at exact pixel sizes).

To change wording, colours or contact details, edit `tools/brand/system.py` and
re-run the build — nothing is hand-placed, so every asset updates together.
