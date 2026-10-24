# Campaign posters — GEMIS · ManaGEM · GEMIS Studio

Nine social posters, three per brand, built to the direction of the thirteen reference
posters committed in "Campaign Social media Posters" (the WhatsApp images dated
2026-10-24): one hero object as the metaphor, a bold two-tone headline with one word in
the accent colour, a saturated monochrome or clean-white ground with a faint grid, a short
services list with line icons, the logo in a top corner, and a web/contact strip at the foot.

Format: 1080 × 1350 (4:5 portrait, the references' ratio). `out/*.png` are 2× (2160 × 2700)
for print and crops; `out/*.jpg` are 1080 × 1350 for Instagram, LinkedIn and WhatsApp.

## The nine

| File | Brand | Reference it takes | Sell |
|---|---|---|---|
| `gemis-01-workarounds` | GEMIS | Cybrinix "Is your business connected?" (white ground, question headline, hero object, web/email footer strip) | Is your business running on workarounds? → systems it can run on |
| `gemis-02-disciplines` | GEMIS | Chess-king ribbon "Strategy. Creativity. Growth." (dark ground, services on ribbons and side labels) | Designed. Built. Supported. — the nine disciplines, 12+ years / 50+ systems / 5+ sectors, Book a Discovery Session |
| `gemis-03-client-says` | GEMIS | Webskitters / Batin "What Our Client Says" (script + bold heading, big quote mark, photo at the foot) | Keshan Patel's endorsement, verbatim; client since 2014 |
| `managem-01-year-end` | ManaGEM | Adva "While others blur, we make you clear" (laptop blurred outside a capsule, thin accent line then bold white line) | Most find out at year end. You see it now. — 14 days free, no card |
| `managem-02-one-record` | ManaGEM | Jenica "This is how we grow your brand" (stacked folder tabs) | Every job on one record — the six steps enquiry → paid, month-end close nine days to two |
| `managem-03-lose-money` | ManaGEM | Digitoria "Make your brand stand out" (white ground, giant headline, dashed arrow to the object, bullets, pill CTA) | A full order book can still lose money — the four leaks, Start your free trial |
| `studio-01-help` | GEMIS Studio | emirac "Hello! Our brand feels invisible / Hold the line" (two voices, two devices, services with icons, closing couplet) | Help! Our team is avoiding the system → Tell us what isn't working |
| `studio-02-designed-to-be-built` | GEMIS Studio | The Shawon "Build your website" (light ground, light/bold headline pair, laptop with the product, small ruled details) | Designed to be built — the four-step ladder with its published prices |
| `studio-03-teardown` | GEMIS Studio | Leaders Conference / Business Insights event poster (presents, two-tone title, play-bullet details row, artwork at the foot) | Book a Product Teardown — 5 days, R6,500 excl. VAT, fee credited within 60 days |

## Where every claim comes from

Nothing on a poster is invented. Copy, figures and names are taken from the three
repositories:

- GEMIS: `gemis-site/scripts/facts.md` (12+ years, 50+ systems, 5+ sectors, client since
  2014), `gemis-site/scripts/endorsements.md` (the quotation, character for character),
  `gemis-site/scripts/services.py` (the nine disciplines), the homepage tagline.
- ManaGEM: `ManaGEM/index.html` (the six-step walkthrough, "a full order book can still
  lose money", "invoiced is not paid", 14-day trial, Sage sync) and `facts.md` ("nine days
  to two", confirmed by the client).
- GEMIS Studio: `gemis-site/studio/src/index.html` (the ladder, prices, timelines, the
  60-day credit, the two-working-day reply, "Designed to be built").

No phone number appears anywhere (the owner removed it on 2026-10-23). Ratings stars from
the quote references were left out: no rating exists to cite. The "Follow us" row from the
Digitoria reference is the LinkedIn company page only, the one channel `facts.md` records.

## Brand systems used

| Brand | Ground | Accent | Type | Logo |
|---|---|---|---|---|
| GEMIS | navy `#0b2642` / paper `#f3f4f6`, the hero sky photograph | blue `#2a5c8a`, sky `#8fb8e0` | Archivo (variable width) | `assets/img/logos/gemis-logo.svg` |
| ManaGEM | navy `#0F172A` / `#0B1222`, white | GEM teal `#00BFA6` | Outfit, IBM Plex Mono for figures | `assets/brand/ManaGEM-logo-horizontal-*.png` |
| GEMIS Studio | ink `#16161a`, paper `#f5f6f8` | pink `#ff1f7a` → orange `#ff7a12` | Manrope, JetBrains Mono | `studio/brand/logo-*.svg`, `mark-colour.svg` |

The product imagery is the real thing: ManaGEM's own dashboard and KPI cards
(`ManaGEM/assets/mockups/`), the Studio's device shots and facet artwork
(`gemis-site/studio/assets/`, `assets/img/studio/`), the HomeAssist case still and the
GEMIS hero photograph. Allura and Caveat (Google Fonts, OFL) supply the script accents
the quote and "Help!" references use.

## Rebuild

```sh
node render.mjs                 # all nine → out/<name>.png at 2×
node render.mjs studio-01-help  # one
```

`render.mjs` inlines `{{inline:assets/x.svg}}` tokens (so the GEMIS wordmark takes
`currentColor`), renames the Manrope subset embedded in the Studio logo SVGs so it cannot
hijack the page's bold weight, and screenshots each page with the pre-installed Playwright
Chromium. Sources are in `src/`, shared rules in `src/base.css`, assets in `assets/`.

## Still to confirm before posting

- A ManaGEM web address. `facts.md` leaves the separate ManaGEM site as FILL and the
  sign-up URL on the site is a placeholder, so the ManaGEM posters route to
  `info@gemis.co.za` and "Start your free trial" with no domain.
- ManaGEM pricing is published on the site but marked "commercial terms not frozen" in the
  ManaGEM README; the posters say "14 days free, no card needed" and do not quote plan prices.
- The Studio's `@`-handle. None is recorded, so the posters carry `gemis.co.za/studio`.
