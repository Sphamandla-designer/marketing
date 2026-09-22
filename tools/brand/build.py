#!/usr/bin/env python3
"""Render every AX-Channels brand asset to PNG.

    python3 tools/brand/build.py            # everything
    python3 tools/brand/build.py social ads # only those sections

Pages are generated as standalone HTML into a scratch directory and then
screenshotted with headless Chromium (Playwright), so what you see in the PNG
is exactly what the CSS in `tools/brand/` describes.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)

OUT_ROOT = os.path.join(ROOT, "brand-assets")
BUILD_DIR = os.path.join(ROOT, ".brand-build")

SECTIONS = {
    "social": "assets_social",
    "stationery": "assets_stationery",
    "presentation": "assets_presentation",
    "collateral": "assets_collateral",
    "ads": "assets_ads",
    "guidelines": "assets_guidelines",
}


def main() -> None:
    wanted = sys.argv[1:] or list(SECTIONS)
    unknown = [s for s in wanted if s not in SECTIONS]
    if unknown:
        raise SystemExit(f"unknown section(s): {', '.join(unknown)}\n"
                         f"available: {', '.join(SECTIONS)}")

    os.makedirs(BUILD_DIR, exist_ok=True)
    jobs = []

    for section in wanted:
        module = __import__(SECTIONS[section])
        assets = module.all_assets()
        print(f"{section}: {len(assets)} asset(s)")
        for asset in assets:
            slug = asset["out"].replace("/", "__").replace(".png", ".html")
            html_path = os.path.join(BUILD_DIR, slug)
            with open(html_path, "w", encoding="utf-8") as fh:
                fh.write(asset["html"])
            jobs.append({
                "html": html_path,
                "out": os.path.join(OUT_ROOT, asset["out"]),
                "width": asset["width"],
                "height": asset["height"],
                "scale": asset.get("scale", 1),
            })

    jobs_path = os.path.join(BUILD_DIR, "jobs.json")
    with open(jobs_path, "w", encoding="utf-8") as fh:
        json.dump(jobs, fh, indent=1)

    print(f"\nrendering {len(jobs)} PNG(s)...")
    subprocess.run(["node", os.path.join(HERE, "render.js"), jobs_path],
                   check=True, cwd=ROOT)
    print("\ndone.")


if __name__ == "__main__":
    main()
