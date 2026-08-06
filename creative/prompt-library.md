# Prompt Library

Reusable blocks for generating more frames in the same campaign look. Compose
one line from each section, in this order: **subject → action → environment →
light → optics → quality**.

## Style spine (paste into every prompt)

```
Modern conference venue, warm natural light from large windows, premium
furniture, printed workbooks on the table, shallow depth of field with soft
background bokeh, realistic skin texture, authentic unposed expression,
documentary editorial photography, natural colour grading, editorial magazine
quality.
```

## Subject variants

- South African marketing consultant, Black woman in her mid-30s, crisp linen blazer over a simple top
- South African marketing consultant, man in his 40s, business casual button-down with sleeves rolled up
- South African marketing consultant, woman in her late 20s with natural hair, business casual blazer
- Workshop facilitator standing at the head of the table, relaxed knit and chinos
- Two consultants sharing one laptop screen, heads turned toward each other

## Action variants

- mid-conversation, gesturing with one hand toward a colleague
- focused on the laptop screen showing an AI chat interface, one hand on the trackpad
- annotating a printed workbook with a pen, laptop open beside them
- leaning back, laughing at something a peer just said
- turning a laptop around to show the table what they built
- listening intently, chin resting on one hand, notebook open

## Optics

| Shot | Lens | Ratio |
| --- | --- | --- |
| Environmental wide, whole room | 35mm | 3:2 |
| Table group, two to three people | 50mm | 3:2 |
| Portrait or over-the-shoulder | 85mm | 3:4 |

## Aspect ratios by placement

- **3:2** — web hero, email header, deck, LinkedIn link preview
- **3:4** — Instagram and LinkedIn feed (crop to 4:5 if the placement needs it)
- **9:16** — Stories, Reels, TikTok. Generate natively rather than cropping a
  3:2; a crop loses the room.

## Negative direction

Append when a generation drifts:

```
No glowing holograms, no floating UI panels, no circuit-board motifs, no cold
blue tech lighting, no shadowless studio lighting, no posed handshakes, no
looking at camera, no legible on-screen text or logos.
```

## Model settings that produced this set

- Model: `soul_2` (Higgsfield, `text2image_soul_v2`)
- Style: General
- Quality: 2K
- Prompt enhancement: off — the prompts are already fully specified, and
  enhancement tends to reintroduce the tech-cliché elements listed above.
