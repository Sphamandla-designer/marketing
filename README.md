# Marketing assets

This repository holds two separate bodies of work.

| Directory | Project |
| --- | --- |
| `brand-assets/`, `tools/brand/` | **AX-Channels brand asset kit** — graphic design built from the AX-Channels logo artwork |
| `creative/`, `copy/`, `assets/workshop/` | **AI training workshop** — imagery direction and channel copy |

---

# AX-Channels — brand asset kit

Logo kit, brand guidelines, social graphics, presentation frames, print
stationery, collateral and display ads, all generated from the supplied
AX-Channels logo files.

- Start with `brand-assets/00-kit-overview.png` — one contact sheet of everything.
- `brand-assets/README.md` has the full index, the print specs, and the list of
  placeholder details to swap before publishing.
- Everything is generated: `python3 tools/brand/build.py` rebuilds every PNG from
  the templates in `tools/brand/`.

The source logo PNGs supplied for the job stay in the repository root
(`AX-Channels logo [Vectorized]*.png`, `Group 9*.png`); `brand-assets/logo/`
holds the same artwork trimmed, named and extended into colourways and icons.

---

# AI Training Workshop — Marketing Materials

Visual and copy assets for a premium AI training workshop aimed at South African
marketing professionals.

## Contents

| Path | What it is |
| --- | --- |
| `creative/brief.md` | The creative direction all assets are built against |
| `creative/shot-list.md` | The four generated hero images: prompts, specs, source URLs |
| `creative/prompt-library.md` | Reusable prompt blocks for generating more in the same style |
| `copy/captions.md` | Channel-ready caption and ad copy |
| `assets/workshop/` | Downloaded image files (see note below) |

## Image files

The four hero images are generated and live at the CDN URLs recorded in
`creative/shot-list.md`. They are **not** committed to `assets/workshop/` — the
Higgsfield CDN host is blocked by the egress policy of the environment these
were generated in, so the binaries could not be pulled down automatically.

To populate `assets/workshop/`, download each URL from `creative/shot-list.md`
and save it under the filename listed alongside it. The filenames are already
referenced by the copy and shot list, so nothing else needs to change.

## Style in one line

Documentary editorial photography — warm natural light, shallow depth of field,
authentic unposed expressions, business casual, premium modern venue. No
stock-photo posing, no cold blue "tech" grading, no fake smiles at camera.
