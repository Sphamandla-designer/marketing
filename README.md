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
