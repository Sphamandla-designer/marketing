#!/usr/bin/env python3
"""
Build the Fisantekraal reference documents.

    python3 references/build.py            # every document, AT-01 from references/atp/*.json
    python3 references/build.py --check    # build, then run the section 10 checks
    python3 references/build.py --check --deliver   # ... and refresh deliverables/

AT-01 is only built from ATP narrative files (STEP A output written from the
official DBE ATP). By default every file in references/atp/ is built; --atp
names one or more files instead.
"""
import argparse
import json
import pathlib
import shutil
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import settings
import data
import documents
import oc01

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "output"
ATP_DIR = HERE / "atp"
DELIVERABLES = HERE.parent / "deliverables"


def atp_terms(spec):
    """The term blocks in an ATP file, whether it holds one term or all four."""
    if "terms" in spec:
        return spec["terms"]
    return [{"term": spec["term"], "weeks": spec["weeks"]}]


def load_specs(paths):
    return [json.loads(pathlib.Path(p).read_text(encoding="utf-8")) for p in paths]


def build(specs):
    made = []
    cls = data.REGISTER_CLASS["class"]

    made.append(("RL-01", f"RL-01-Register-Class-List-{cls}.pdf", documents.rl01()))

    s = documents.sl01("Mathematics", f"{cls}-MT", data.MATHS_10B,
                       f"Mathematical Literacy — {cls}-ML",
                       "This class splits for Mathematics. Learners not on this "
                       "list are on the Mathematical Literacy list.",
                       data.EDUCATORS[f"{cls}-MT"])
    made.append(("SL-01", f"SL-01-Split-Class-List-{cls}-MT.pdf", s))

    s = documents.sl01("Mathematical Literacy", f"{cls}-ML", data.MATHS_LIT_10B,
                       f"Mathematics — {cls}-MT",
                       "This class splits for Mathematical Literacy. Learners "
                       "not on this list are on the Mathematics list.",
                       data.EDUCATORS[f"{cls}-ML"])
    made.append(("SL-01", f"SL-01-Split-Class-List-{cls}-ML.pdf", s))

    s = documents.sl01("Tourism", f"{cls}-TO", data.TOURISM_10B,
                       f"Civil Technology (Woodworking) — {data.COMBINED_CODE}",
                       f"Learners in {cls} not on this list take Civil Technology "
                       "(Woodworking); see CL-01.",
                       data.EDUCATORS[f"{cls}-TO"])
    made.append(("SL-01", f"SL-01-Split-Class-List-{cls}-TO.pdf", s))

    made.append(("CL-01", f"CL-01-Combined-Class-List-{data.COMBINED_CODE}.pdf",
                 documents.cl01()))
    made.append(("SC-01", f"SC-01-Subject-Code-Key-Grade-{data.GRADE}.pdf",
                 documents.sc01()))

    made.append(("OC-01", "OC-01-Conduct-Observation-Code-Reference.pdf", oc01.build()))

    for spec in specs:
        # one AT-01 page per term; four terms make the year
        for block in atp_terms(spec):
            weeks = [(w["week"], w["narrative"]) for w in block["weeks"]]
            s = documents.at01(spec["subject"], spec["abbr"], spec["grade"],
                               block["term"], weeks, spec["source"])
            name = (f"AT-01-ATP-Weekly-{spec['abbr']}-Gr{spec['grade']}-"
                    f"T{block['term']}.pdf")
            made.append(("AT-01", name, s))

    # stale output from an earlier data set must not survive a rebuild
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.pdf"):
        old.unlink()
    for code, name, sheet in made:
        sheet.save(OUT / name)
        print(f"  {code}  {name}")
    return ([(c, OUT / n) for c, n, _ in made],
            [(c, sh) for c, _, sh in made])


def deliver(built):
    """Refresh deliverables/ with the reference PDFs. The SA-01 and SA-02
    blanks there come from forms/ (npm run blanks); SA-OC is retired and
    never copied."""
    DELIVERABLES.mkdir(exist_ok=True)
    keep = {p.name for _, p in built}
    for old in DELIVERABLES.glob("*.pdf"):
        if old.name.startswith(("RL-01", "SL-01", "CL-01", "SC-01", "AT-01",
                                "OC-01", "SA-OC")) and old.name not in keep:
            old.unlink()
            print(f"  removed stale {old.name}")
    for _, p in built:
        shutil.copyfile(p, DELIVERABLES / p.name)
    print(f"  copied {len(built)} PDFs to {DELIVERABLES.relative_to(HERE.parent)}/")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--atp", nargs="*",
                    help="ATP narrative JSON file(s); default: references/atp/*.json")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--deliver", action="store_true",
                    help="copy the built PDFs into deliverables/")
    args = ap.parse_args()
    paths = args.atp if args.atp else sorted(ATP_DIR.glob("*.json"))
    specs = load_specs(paths)
    print("Building reference documents:")
    built, sheets = build(specs)
    rc = 0
    if args.check:
        import check
        extra = sorted(DELIVERABLES.glob("SA-0*.pdf"))   # the SA-01 and SA-02 blanks
        rc = check.run(built, sheets, specs, extra)
    if args.deliver and rc == 0:
        print("\nDelivering:")
        deliver(built)
    sys.exit(rc)
