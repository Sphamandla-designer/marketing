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

---

# GEMIS Technical Academy (gemis.tech) — nine posters by purpose

Built from `briefs/gemis.tech-page-briefs-2026-10-24.docx`, the brief for the three
pages that sell the Academy's public offers. Each page gets three posters, one per
purpose. The Academy look is read off the live site (the mockup at
`gemis-site/assets/img/portfolio/gemistech-mock.jpg`): navy `#1B2A4A` (the theme colour
the brief records), gold action buttons, Playfair Display with gold italic emphasis,
cream paper sections and the hexagon mark. Shared rules are in `src/academy.css`.

| File | Page | Purpose | Sell |
|---|---|---|---|
| `advantage-01-event` | AI Advantage | Event | Now booking: 2 days · 12 activities · max 20 seats, Cape Town · Stellenbosch · Johannesburg, first delivered at Jordan Wine Estate |
| `advantage-02-promo` | AI Advantage | Advertising & promotion | The lowest price the retreat will ever be: R5,999 Flexible Voucher, R8,999 struck, full-refund promise |
| `advantage-03-guide` | AI Advantage | Informational | The two-day arc, the five tracks A01–A05, what's included |
| `express-01-event` | Express | Event | Saturday working sessions, 09:00–13:00, the four-theme line-up and what each produces |
| `express-02-promo` | Express | Advertising & promotion | Four hours. One new workflow. You keep it forever. 50% off: R1,249, R2,499 struck |
| `express-03-guide` | Express | Informational | What you'll build in each theme, what you need, what every voucher includes |
| `education-01-promo` | Education Excellence | Advertising & promotion | You didn't become a teacher to spend your evenings on admin. SPARK, R5,999, R300 per educator |
| `education-02-guide` | Education Excellence | Informational | The four streams, 250+ activities, the SPARK → MASTERY PLUS ladder |
| `education-03-sponsor` | Education Excellence | Sponsorship appeal (in place of an event poster) | Give a school its first step into AI: one SPARK for up to 20 educators |

**Why Education has no event poster.** SPARK is booked by a school and delivered on its
own premises; there is no public date or venue to promote. The page's second goal is
sponsor acquisition, so that slot is a sponsorship appeal.

**What the posters deliberately leave out**, because the brief's own inconsistency list
flags it:

- AI Advantage team discounts (the FAQ and the table disagree, #1) and the "Sandton venue" meta line (#10).
- Express dates (the published schedule is in the past, #2), voucher validity (60 vs 90 days, #3), the six named testimonials (unverified, #4), volume discounts (#6), and the delivery platform (Teams vs Zoom, #8). The event poster points to gemis.tech/events for dates instead.
- TRANSFORM (not on the page, #5) and "maximum 20%" (#13) on Education.
- Gemini from every public tool list (internal content rule, #12).
- The unattributed Jordan Wine Estate quote (#15).
- The phone number. Only `training@gemis.tech` and the page URLs are used.

**To confirm before posting:** the Academy lockup is rebuilt from the GEMIS hexagon mark
plus "GEMIS / Technical Academy" in Playfair, because no Academy logo file is in the
repos and gemis.tech is not reachable from this environment. Swap in the real logo if it
differs. The Jordan Wine Estate scene is an illustration, not the estate photograph.

---

# ManaGEM LinkedIn company banner

`src/managem-linkedin-banner.html` → `out/managem-linkedin-banner.png` (2256 × 382, upload
this one; LinkedIn downsamples it sharply) and `out/managem-linkedin-banner-1128x191.png`
(the exact spec size). `out/managem-linkedin-banner-preview.png` shows it with the page
logo where LinkedIn places it.

One promise, one proof line, one call to action, set as one block at x 400–810 so the
logo's bottom-left corner stays clear and mobile's side crop keeps every word:

- Headline: Know where every job stands, from enquiry to invoice.
- Proof line: Quotes · Jobs · Stock · Production · Invoices
- CTA chip: 14 days free · No card needed · managem.co.za

ManaGEM's own system: navy `#0B1222` → `#162036`, GEM teal `#00BFA6`, Outfit with
IBM Plex Mono for the proof line, the ribbon M as a faint watermark at the right.

**Confirm before uploading:** `managem.co.za`. The ManaGEM README records the sign-up
address `app.managem.co.za/signup` as a placeholder, and `facts.md` leaves the separate
ManaGEM site as FILL, so the domain should be live before the banner goes up.

`render.mjs` now honours `<meta name="canvas" content="WxH">` for non-poster sizes.

---

# AX-Channels × Eksellent Labs — channel partnership poster

`src/ax-eksellent-partnership.html` → `out/ax-eksellent-partnership.png` (2160 × 2700) and
`.jpg` (1080 × 1350). The reference is the "Connecting Vision with Opportunity" partnership
poster uploaded on 2026-10-25 (`refs/partnership-reference.jpeg`, from the "partnership"
commit on the higgsfield branch).

What it takes from the reference: the dark ground under a fine curved line field, the two
logos side by side at the top, a bold-then-light two-line headline, a central hero image
of two things joining, the coloured glow rising from the foot, an arrow and the web
address across the top, and the logo plus contact block in the footer.

What is AX-Channels': ink `#0C0C0C` and magenta `#D62F6C` / `#F06E9A`, Poppins for
display and Inter for text, the white logo, and hairline stripes cut to the AX mark's
51.6° diagonal — all from the AX-Channels kit (`tools/brand/system.py`, branch
`claude/blissful-cori-yyvaq7`). The handshake becomes two linked rings, white and
magenta, so the image belongs to the brand rather than a stock photo.

Copy: "Channel partnership" · "Stronger together. Built to perform." (the second line
echoes the AX tagline, "Designing Digital Experiences That Perform.") · "AX-Channels and
Eksellent Labs are now channel partners — one team, more reach for every client we serve."

**Confirm before posting:**

- **Eksellent Labs' logo.** No logo, site or description for Eksellent Labs is in any repo
  or turns up in a web search, so its name is typeset in Poppins as a placeholder. Drop
  the logo file into `assets/` and replace the `.ek` block with an `<img>`.
- **The spelling "Eksellent Labs"** — taken from the request as written.
- **AX-Channels contact details.** `www.axchannels.co.za` and `hello@axchannels.co.za`
  are the kit's own placeholders (its README says to swap them before publishing). No
  phone number is used; the kit's is `+27 00 000 0000`.
- **The benefit line** describes the partnership generally. Replace it with what the
  partnership actually offers once that is agreed.

**Revision (2026-10-25): the reference, kept as designed.** At the owner's request the
poster now *is* the uploaded reference — its curved line field, handshake photograph,
gradient, arrow and layout — with only the colour and the words changed.
`tools-recolour-reference.py` shifts the reference's purple (hue 230–300) to AX-Channels
magenta, leaving the suits, cuffs and skin untouched, and lifts out the old wording and
logos with frequency-selective inpainting so the line field runs on underneath
(`assets/partnership-ground.png`). The page then sets the new copy in the reference's
own positions and sizes, in Poppins:

- Logos: AX-Channels · Eksellent Labs (typeset until its logo is supplied)
- Headline: **Stronger Together** / as Channel Partners.
- Top right: www.axchannels.co.za · Footer: AX-Channels logo, hello@axchannels.co.za,
  "AX-Channels | Eksellent Labs"

The photograph comes from the 736 × 920 reference, upscaled to 1080 × 1350, so it is a
little softer than the type. For print or a larger format, use the original high-resolution
image the reference was made from. Re-run with `python3 tools-recolour-reference.py`
(needs `opencv-contrib-python-headless`), then `node render.mjs ax-eksellent-partnership`.
