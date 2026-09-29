#!/usr/bin/env python3
"""
Build the Fisantekraal reference documents.

    python3 references/build.py            # every document that has its data
    python3 references/build.py --check    # build, then run the section 8 checks

AT-01 is only built when an ATP narrative file is supplied with --atp; it is
never generated from anything but the official DBE ATP.
"""
import argparse
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import settings
import data
import documents

OUT = pathlib.Path(__file__).resolve().parent / "output"


def build(atp_path=None):
    made = []

    s = documents.rl01()
    made.append(("RL-01", "RL-01-Register-Class-List-9B.pdf", s))

    s = documents.sl01("Mathematics", "9B-MT", data.MATHS_9B,
                       "Mathematical Literacy — 9B-ML", "Mathematical Literacy",
                       data.EDUCATORS["9B-MT"])
    made.append(("SL-01", "SL-01-Split-Class-List-9B-MT.pdf", s))

    s = documents.sl01("Mathematical Literacy", "9B-ML", data.MATHS_LIT_9B,
                       "Mathematics — 9B-MT", "Mathematics",
                       data.EDUCATORS["9B-ML"])
    made.append(("SL-01", "SL-01-Split-Class-List-9B-ML.pdf", s))

    made.append(("CL-01", "CL-01-Combined-Class-List-9ABC-WW.pdf", documents.cl01()))
    made.append(("SC-01", "SC-01-Subject-Code-Key-Grade-9.pdf", documents.sc01()))

    if atp_path:
        spec = json.loads(pathlib.Path(atp_path).read_text())
        weeks = [(w["week"], w["narrative"]) for w in spec["weeks"]]
        s = documents.at01(spec["subject"], spec["abbr"], spec["grade"],
                           spec["term"], weeks, spec["source"])
        name = (f"AT-01-ATP-Weekly-{spec['abbr']}-Gr{spec['grade']}-"
                f"T{spec['term']}.pdf")
        made.append(("AT-01", name, s))

    OUT.mkdir(parents=True, exist_ok=True)
    for code, name, sheet in made:
        sheet.save(OUT / name)
        print(f"  {code}  {name}")
    return ([(c, OUT / n) for c, n, _ in made],
            [(c, sh) for c, _, sh in made])


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--atp", help="JSON file of STEP A weekly narratives")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    print("Building reference documents:")
    built, sheets = build(args.atp)
    if args.check:
        import json as _json
        import check
        spec = _json.loads(pathlib.Path(args.atp).read_text()) if args.atp else None
        sys.exit(check.run(built, sheets, spec))
