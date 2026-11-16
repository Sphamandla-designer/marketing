# ManaGEM — "Please Hold" — handoff for the next session

Read this first. It carries the state of the work into a fresh session.

## Where things stand

- **Concept, treatment and script are approved.** Do not change the creative concept
  without discussing it with the client first.
- **No footage has been generated.** No credits have been spent on any service.
- **Kling AI** is the chosen generation service. The `marketing` environment allows
  `kling.ai`. In the previous session the Kling connector reached the server but was
  waiting for the account owner to sign in.

## Kling account check (16 November 2026)

- Signed in and responding. Membership: NORMAL (non-member). Credits: 0.
- Every video model is limited to **720p** on this membership. 1080p needs a paid
  membership. 4K is not enabled on Kling 4.0 at all.
- The connector exposes no price list and no cost preview, so credit costs per shot
  could not be quoted from here. They must be read from Kling's own pricing page.
- Video models available: Kling 4.0 (flagship, 3–30 s, first frame plus optional
  tail frame and keyframes), Kling 4.0 Flash, Kling 3.0, Kling 3.0 Omni (reusable
  subjects, native audio, 3–15 s), Kling 3.0 Turbo, Kling O1, 2.6, 2.5.
- Image models available: Kling Image 3.0 Omni (default, up to 2K as non-member),
  Kling Image 3.0, O1, 2.1, Nano Banana Pro, Nano Banana 2, GPT-Image-2 and 2.5
  (up to 4K).
- Recommended: reference stills first, then Kling 4.0 image-to-video from the
  approved still, audio off, 16:9. Nothing has been submitted.
- Kling reported that its tool list has been updated; reconnect the connector or
  start a new session before generating.

## Video toolkit (16 November 2026)

- `video/` is a Remotion project: reusable end card, untouched product inserts and
  a data-driven animatic. See `video/README.md`.
- Renders are in `managem/renders/`: the 45-second animatic, the end card and the
  three clean product inserts. All 1920 x 1080, 25 fps.
- The animatic uses text boards for shots not yet made, scratch sound synthesised
  in code, and subtitles in place of voices.
- Timing finding from the animatic: shot 8 is tight. Lerato's line, "Mrs Pillay?",
  "Hello?" and "Thanks, Lerato." only fit before the voiceover if each pause is
  about 0.4 s. The script wanted longer silences.
- Remotion needs a paid company licence for a for-profit company with more than
  three employees. Check before these renders are used commercially.

## Documents, in reading order

| File | What it holds | Status |
| --- | --- | --- |
| `please-hold-production-readiness.md` | Part one of the 45-second script (shots 1–8), the hybrid production plan, the three tests, the visual continuity guide | Current |
| `please-hold-product-truth.md` | Part two of the script (shots 9–17), what the administrator does in ManaGEM, the verification register | Current. Supersedes part two of the file above |
| `test-shots.md` | Status of the three tests, the client's two prompts verbatim, cost checks, product-capture findings | Current |
| `product-captures/` | Real screens from the ManaGEM prototype: six full captures, three inserts, one unbroken walkthrough | Internal tests only; names not cleared for broadcast |
| `please-hold-final-treatment.md` | Round 2 treatment: self-critique, openings, endings | Scripts in it are superseded |
| `creative-treatment.md` | Round 1: three concepts | Superseded for "Please Hold" |

## Standing instructions from the client

1. Do not spend any credits without explicit approval of the exact settings and cost.
2. Generate character reference stills first. Wait for approval before animating.
3. Keep the approved production direction and treatment intact.
4. Priority: professional, consistent, photorealistic footage fit for a national
   television commercial.
5. Lerato is filmed, not generated. Sizwe, Anusha and Mr Jacobs are generated.
6. Product screens are always real captures. Never generate an interface.

## Next steps, in order

1. Confirm Kling is signed in. Check membership and credits.
2. List the video and image models the account can use. Recommend one for
   photorealistic human close-ups with image-to-video from a start frame, at 1080p or
   higher, 16:9.
3. Show the credit cost of: one Sizwe reference still, one Mr Jacobs reference
   still, the Sizwe shot (about 7 s), the Mr Jacobs shot (about 4–5 s).
4. Wait for the client's decision on the six prompt adjustments below.
5. On approval only: generate the two reference stills. Stop and wait.
6. On approval only: animate from the approved stills.

## The six proposed prompt adjustments — awaiting the client's decision

None has been applied. The client's prompts are verbatim in `test-shots.md`.

| # | Prompt | Client's wording | Proposed wording | Why |
| --- | --- | --- | --- | --- |
| 1 | Sizwe | "in his late 30s to mid-40s" | "aged 46, close-cropped hair greying at the temples, a short beard with grey in it, sun-lined eyes" | This prompt is the reference for every later Sizwe shot. An age range lets each generation pick a different man. The approved guide fixes him at 46 |
| 2 | Sizwe | "practical, slightly weathered workwear, safety boots and appropriate construction PPE" | "a faded navy work shirt with the sleeves rolled twice, charcoal work trousers, scuffed tan boots, an open orange hi-vis vest, a plain steel watch on the left wrist, a wedding band. No teal or bright blue anywhere in frame" | Unspecified wardrobe becomes whatever the model invents, and then has to be matched for ever. Teal and blue are reserved for the product screen and end card |
| 3 | Sizwe | "Medium close-up, eye-level perspective, 50mm cinematic lens aesthetic" | "Close-up, three-quarter view, eye level, 85mm lens aesthetic" | The performance described, realising the customer has gone, is shot 8, which the script frames as a close-up. A 50 mm medium is shot 3, a different moment with a diary and crew |
| 4 | Mr Jacobs | "He marks the count on a small physical checklist using a marker" | "He touches each drum in turn and ticks its lid with a black marker" | A checklist is a page of text, and the same prompt asks for no generated text. The lid tick is what the approved script shows, and it is simpler for the model |
| 5 | Mr Jacobs | "A carefully composed medium shot transitioning visually into a close-up of his hand" | "One locked-off medium-wide shot. No change of framing" | A reframe inside one generated clip is where objects and hands drift, which is what this test exists to check. The hand close-up is better made as a separate filmed insert |
| 6 | Mr Jacobs | no phone mentioned | "A mobile phone lies face-up on a drum lid beside him, on speaker" | The phone is how Lerato hears him counting. Without it he is a man in a storeroom, not a link in the chain |

Also proposed for Mr Jacobs, to match the continuity guide: "aged 58, lean, tall,
slightly stooped, short grey hair, clean-shaven, reading glasses on a cord, a grey
dust coat over a checked shirt; white 20-litre drums in rows of six."

## Known open items outside generation

- GEMIS to confirm the verification register (V1–V11) against the live product.
- GEMIS to build a clean example account for the film.
- The timed, unbroken run of the administrator's sequence on the live product.
- End-card wording and address.

## Suggested opening message for the new session

> Read `managem/HANDOFF.md` and continue from "Next steps". Start by checking the
> Kling connection and credits. Do not spend anything without my approval.
