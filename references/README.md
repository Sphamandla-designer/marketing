# Fisantekraal High School — pre-printed reference documents

Five controlled reference documents that teachers keep in the class file and
read from when completing the two weekly fill-in forms, **SA-01** (register
class) and **SA-02** (subject class). Nothing here is filled in by hand: every
number and code is printed.

| Code | Document | Used with |
|---|---|---|
| RL-01 | Register class list | SA-01 |
| SL-01 | Split subject class list | SA-02 |
| CL-01 | Combined subject class list | SA-02 |
| SC-01 | Subject code key | SA-02 |
| AT-01 | ATP weekly plan | SA-02, Section C |

## Build

```
python3 references/build.py --check
```

PDFs land in `references/output/`. `--check` runs the section 8 delivery checks:
one A4 portrait page each, nothing outside the 10 mm margins, no type below the
stated minimum, nothing shortened to fit a column, nothing crossing the footer
rule, every list numbered from 1 alphabetically by surname, the 9B learners the
same on all three lists, the split groups partitioning the class, and every code
on the lists present on SC-01.

Change the year, term, code rules and list version in `settings.py`. Learner and
subject data lives in `data.py`.

## AT-01

AT-01 is only built from the official DBE ATP. Supply the weekly narratives as
JSON and pass the file:

```
python3 references/build.py --atp references/atp-input.example.json --check
```

The ATP code for each week is derived from subject + grade + term + week, so
reprinting a page gives the same codes. `check.py` verifies each code is four
characters from the allowed alphabet and each narrative is within the character
limit.

## Placeholder and provisional — read before printing

**Placeholder (replace with real school data):**

- Every learner name on RL-01, SL-01 and CL-01 is fictional.
- Register class 9B, class teacher Mr L. Petersen, room B12, 34 learners.
- The split of 9B into Mathematics (19) and Mathematical Literacy (15).
- The combined Woodworking group 9ABC-WW and its 48 learners, 16 from each of
  9A, 9B and 9C.
- Every educator name on SC-01 and the class lists.
- The 9A and 9C rows on SC-01 are padding, trimmed to what one page holds at the
  6 mm row pitch; 9A and 9C therefore show six subjects each while 9B shows all
  nine. 9B is complete because RL-01, SL-01 and CL-01 are all 9B documents.
- Grade 9 and classes 9A–9C throughout.
- AT-01's placeholder run (English First Additional Language, Grade 8, Term 1)
  has not been produced — see "Not yet delivered" below.

**Provisional (school policy not fixed yet):**

- The subject class code format `[Grade][Class]-[Subject abbreviation]`, and
  every code built from it. Printed on SC-01 as provisional.
- The ATP code scheme: 4 characters from digits 2–9 and letters A–Z without I
  and O. Printed on AT-01 as provisional.
- List version 1, effective **[date to be confirmed]** — the effective date
  prints as that literal placeholder on every list.
- Academic year 2027, Term 1.

## Not yet delivered

**AT-01 has not been built.** It needs two things that were not supplied:

1. The official DBE ATP PDF for English First Additional Language, Grade 8
   (the prompt refers to an attachment that did not arrive).
2. Which term to produce, or "all terms", and optionally a single week.

The renderer, the ATP code generator and the checks are finished and tested; the
narratives are the only missing input. They are not written from anything but
the ATP itself, so nothing was invented to fill the gap.

## One deviation from the written spec

RL-01's subjects panel was specified as three side-by-side columns. Three equal
columns across 190 mm cannot hold a subject name like "Economic and Management
Sciences" at the 9 pt table minimum without truncating it, so the three groups
keep their own headed tables but the split and combined groups are stacked in
the right-hand column. Nothing is shortened and no type is below 9 pt.

## Design

OC-01 is not in this repository, so the design language is built from the
written specification in section 1 of the brief — red #C8102E, dark text
#1A1A1A, light pink #FBE3E6 panels, alternating row tint, the crest and centred
masthead, the outlined controlled-reference box, the full-width red title bar,
red-headed tables with codes in bold red, and the three-part footer. It should
be compared against the real OC-01 before printing.
