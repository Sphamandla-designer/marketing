# ManaGEM — "Please Hold" — production tests

Status of the three tests agreed in `please-hold-production-readiness.md`.

| Test | Shot | Status |
| --- | --- | --- |
| 1 | Sizwe on the roof | **Not generated.** Blocked on Higgsfield credits |
| 2 | The product on screen | **Captured** from the real product prototype. See `product-captures/` |
| 3 | Mr Jacobs counting drums | **Not generated.** Blocked on Higgsfield credits |

---

## Tests 1 and 3 — why nothing was generated

The connected Higgsfield account is on the free plan with **0.02 credits**. Costs
were checked with the tool's cost preflight; no job was submitted.

| Item | Model and settings | Credits |
| --- | --- | --- |
| One reference still, 16:9 | GPT Image 2.6 | 0.25 |
| Sizwe, 7 s, 1080p, no audio | Seedance 2.5 | 112 |
| Sizwe, 7 s, 720p, no audio | Seedance 2.5 | 49 |
| Sizwe, 7 s, 480p draft (can be finalised later) | Seedance 2.5 | 21 |
| Sizwe, 7 s, pro mode, no audio | Kling 3.0 | 12.25 |
| Mr Jacobs, 4 s, 1080p, no audio | Seedance 2.5 | 64 |

Suggested order once credits are available: approve a reference still of each
character first (0.25 credits each), then animate from the approved still. Iterating
on a face at still-image cost is far cheaper than iterating on video.

---

## The two supplied prompts — notes before they are run

The prompts are kept exactly as supplied in the section below. These are the points
where they differ from the approved script and continuity guide. Each needs a
decision, because the Sizwe prompt declares itself the character reference for every
later shot.

### Sizwe

| Point | Supplied prompt | Approved documents | Suggested resolution |
| --- | --- | --- | --- |
| Age | Late 30s to mid-40s | 46, greying at the temples, grey in the beard | Choose one now. The reference fixes it for the whole film |
| Which shot this is | Medium close-up, 50 mm, the moment he realises the customer has gone | That moment is shot 8: a close-up on an 85 mm. The 50 mm medium is shot 3, where he is still waiting, with a diary in his hand and crew behind him | Treat this as shot 8 and use the closer framing |
| Other people | "No additional people" | Shot 3 has crew working, soft, in the background. Shot 8 does not need them | Correct for shot 8 |
| Wardrobe | "Practical, slightly weathered workwear" | Faded navy work shirt with sleeves rolled, charcoal trousers, tan boots, open orange hi-vis vest, steel watch, wedding band | Put the specific wardrobe in the prompt. Otherwise the reference becomes whatever the model chooses |
| Brand colour | Not mentioned | No teal or bright blue anywhere except the product screen | Add as an exclusion |
| Speech | None | Shot 8 has five spoken words | Fine for a first face test. The lip-sync test needs the recorded voice and is a second step |

### Mr Jacobs

| Point | Supplied prompt | Approved documents | Suggested resolution |
| --- | --- | --- | --- |
| What he marks | A small physical checklist | He ticks each drum lid with a marker | Keep the lid. A checklist is a sheet of text, and the prompt also asks for no generated text |
| Camera | "Medium shot transitioning visually into a close-up of his hand" | One locked-off medium-wide shot | Generate the medium shot only. A move from medium to close-up inside one generated clip invites exactly the drift this test is checking for. The close-up of hand and marker is a candidate for a filmed insert |
| The phone | Not mentioned | A mobile lies on a drum lid, on speaker. It is the link to Lerato, who is listening to him count | Add it. Without the phone he is not part of the chain |
| Wardrobe | "Practical workwear" | Grey dust coat over a checked shirt, reading glasses on a cord, marker in the breast pocket | Put the specifics in the prompt |
| Drums | "Waterproofing material drums" | White 20-litre drums with blue lids, in rows of six | Put the specifics in the prompt, minus the blue if the no-blue rule is applied strictly |

---

## Test 2 — the product on screen

### What was done

The real ManaGEM prototype (`reference/product/managem-app.html` in the ManaGEM
repository) was opened in a desktop browser at 1920 × 1080, signed in with its
prefilled user, and operated through the exact sequence in
`please-hold-product-truth.md`. Nothing on any screen was edited, redrawn or
composited. The data is the prototype's own example data.

### Files in `product-captures/`

| File | What it shows |
| --- | --- |
| `01-open-enquiries.png` | Open Enquiries, unfiltered. Lerato's starting screen |
| `02-open-enquiries-filtered.png` | The same list after typing a customer name in its Search box |
| `03-enquiry-record.png` | The enquiry record that opens from the row |
| `04-enquiry-record-grand-total.png` | The record scrolled to the quote totals |
| `05-products-filtered.png` | Products & Pricing filtered to one product |
| `06-bookings-filtered.png` | Bookings filtered to one customer |
| `insert-A-grand-total.png` | 16:9 insert for shot 12: *Grand Total — R 166 313,00* |
| `insert-B-stock.png` | 16:9 insert for shot 13: *STOCK — 42* |
| `insert-C-booking.png` | 16:9 insert for shot 14: *START 01 May 2026 · DAYS 8 · FOREMAN Michael Moroke · SCHEDULED* |
| `walkthrough-unbroken.webm` | One continuous recording of the whole sequence |

Full screens are 3840 × 2160. Inserts are cropped from the same render.

### Findings

1. **All three inserts are legible** as stills at 16:9. Each shows one label with its
   value directly beneath or beside it, with no manipulation.
2. **The stock row also shows a MIN QTY column** beside STOCK. This was not noticed
   in earlier rounds. It means the insert shows the on-hand figure next to the
   product's minimum, which strengthens "Forty-two drums in the store."
3. **The stock insert does not show the product's name.** As predicted, the
   description is at the far left of the row. The viewer relies on the preceding shot
   and on Lerato's line.
4. **The booking insert does not show the customer's name** for the same reason.
5. **The sequence took 8.7 seconds** in the continuous recording: price read at
   2.9 s, stock at 5.5 s, start date at 8.7 s. This was driven by a script typing at a
   human pace on a local prototype with no network delay. It is an indication that
   the task fits the eleven and a half seconds the film gives it. It is not the
   timed test on the live product that V10 requires.
6. **The prototype's example data is consistent for one customer.** Searching "MST"
   gives an enquiry whose record totals R 166 313,00 and a booking starting
   01 May 2026 with a named foreman, and the 20-litre acrylic product shows 42 in
   stock. So the prototype can be used as it stands for a rough cut.

### Still not tested

- Legibility at television distance and in the 9:16 version on a phone, in motion,
  at the scripted durations. That needs the inserts cut to Lerato's recorded lines.
- The screen filmed off a real monitor, for moiré and flicker.
- Anything on the live product.

### Before any of these captures is broadcast

They are for internal tests only. The customer, contact and staff names in the
prototype's example data have not been cleared, and the ManaGEM repository's history
records that a build containing a client's records was removed. The film itself
needs the clean example account described in `please-hold-product-truth.md`.

---

## The supplied prompts, verbatim

### Sizwe

> Create a photorealistic, premium television commercial shot for a South African
> business software advertising campaign.
>
> SCENE: A South African roofing and waterproofing contractor stands on the flat roof
> of a commercial building in Johannesburg. He is a competent, experienced business
> owner in his late 30s to mid-40s. He wears practical, slightly weathered workwear,
> safety boots and appropriate construction PPE. He holds a smartphone to his ear.
>
> PERFORMANCE: He is listening carefully. His expression is controlled and
> professional, but there is a subtle realisation that the customer may already have
> moved on. He is not panicking, not angry and not exaggeratedly emotional. He looks
> like a hardworking business owner who genuinely cares about his customers.
>
> CAMERA: Medium close-up, eye-level perspective, 50mm cinematic lens aesthetic. The
> camera makes a very subtle, controlled push towards his face. His face remains the
> visual focus. Keep the composition natural and observational, as though captured by
> an experienced commercial film director.
>
> ENVIRONMENT: A believable South African commercial rooftop. Visible waterproofing
> work, roofing details and distant Johannesburg urban buildings. The environment
> must look operational and authentic, not like a luxury property advertisement.
>
> LIGHTING: Late-afternoon natural sunlight, soft directional light, realistic skin
> tones, controlled highlights and natural shadows.
>
> VISUAL STYLE: High-end live-action commercial cinematography. Realistic human
> anatomy, natural skin texture, authentic fabric detail, subtle film grain,
> sophisticated colour grading, realistic depth of field.
>
> FORMAT: 16:9 horizontal composition. The character's face and phone must remain
> clearly visible. Preserve sufficient visual space around the subject for editing.
>
> CONTINUITY: This is Sizwe's established character reference. Maintain the same
> face, hairstyle, facial hair, build, wardrobe and accessories in every subsequent
> Sizwe shot.
>
> IMPORTANT: No subtitles, no titles, no logos, no generated text, no visible
> software interfaces, no artificial camera shake, no slow-motion effects, no
> dramatic acting, no additional people, no distorted hands or phone.
>
> The result must look like a frame from a professionally directed national
> television commercial, not an AI-generated video.

### Mr Jacobs

> Create a photorealistic cinematic commercial shot inside a working South African
> roofing and waterproofing contractor's storeroom.
>
> SUBJECT: Mr Jacobs, a South African male storeman in his late 40s to mid-50s,
> wearing practical workwear. He is experienced, focused and methodical.
>
> ACTION: He carefully counts waterproofing material drums. His hand moves naturally
> from one drum to the next. He marks the count on a small physical checklist using a
> marker. Each drum is clearly visible and remains consistent in shape, size, colour
> and position.
>
> CAMERA: A carefully composed medium shot transitioning visually into a close-up of
> his hand marking the checklist. The camera remains stable and observational. No
> exaggerated movement.
>
> ENVIRONMENT: A believable industrial storeroom with neatly arranged waterproofing
> products, construction materials and practical shelving. The setting must feel used
> and functional rather than staged.
>
> LIGHTING: Natural daylight entering through the storeroom entrance, complemented by
> subtle industrial overhead lighting. Realistic shadows and detailed material
> textures.
>
> MOOD: Quiet concentration. The storeman is doing his job properly. The tension
> comes from the delay in communication, not from his incompetence.
>
> VISUAL STYLE: Premium live-action television advertising, photorealistic,
> sophisticated cinematic composition, realistic South African industrial
> environment, natural colour grading.
>
> FORMAT: 16:9 horizontal, high detail.
>
> CONTINUITY: Maintain the same storeman appearance, wardrobe, drums, checklist and
> storeroom layout across all related shots.
>
> IMPORTANT: No subtitles, no logos, no generated text, no extra fingers, no changing
> drum counts, no duplicated objects, no artificial-looking movements, no exaggerated
> expressions.
