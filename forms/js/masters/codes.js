/**
 * Code schemes for the master documents.
 *
 * Both schemes are PROVISIONAL. They are defined here, in one place, so the
 * school can change the format without touching any layout code.
 */

/** Characters kept out of every generated code: teachers copy these by hand
 *  onto SA-01/SA-02 and the forms are scanned, so O/0 and I/1 must not meet. */
export const AMBIGUOUS = new Set(['O', '0', 'I', '1', 'l']);

/** Subject abbreviations, 2 letters, none of them ambiguous. */
export const SUBJECTS = [
  { abbr: 'MT', name: 'Mathematics' },
  { abbr: 'ML', name: 'Mathematical Literacy' },
  { abbr: 'EH', name: 'English Home Language' },
  { abbr: 'AF', name: 'Afrikaans First Additional Language' },
  { abbr: 'NS', name: 'Natural Sciences' },
  { abbr: 'SS', name: 'Social Sciences' },
  { abbr: 'EM', name: 'Economic and Management Sciences' },
  { abbr: 'TC', name: 'Technology' },
  { abbr: 'CA', name: 'Creative Arts' },
  { abbr: 'LO', name: 'Life Orientation' },
];
export const subjectName = (abbr) => (SUBJECTS.find((s) => s.abbr === abbr) || {}).name || abbr;

/**
 * Subject class code: [grade][register class][subject abbreviation], e.g.
 * 8AMT. Combined classes use the marker X in place of a single class, e.g.
 * 8XEM. Change this one function to change the format everywhere.
 */
export const COMBINED_MARKER = 'X';
export function subjectClassCode({ grade, registerClass, subject, combined = false, group = '' }) {
  const cls = combined ? COMBINED_MARKER : registerClass;
  return `${grade}${cls}${subject}${group}`.toUpperCase();
}

/**
 * Weekly ATP code, exactly 4 characters: [year][grade][subject][week].
 *
 * Year and week are drawn from alphabets that exclude the ambiguous
 * characters, so a handwritten code cannot be misread. PROVISIONAL.
 */
const YEAR_LETTER = { 2025: 'P', 2026: 'Q', 2027: 'R', 2028: 'S' };
const WEEK_CHAR = 'ABCDEFGHJKMN'.split(''); // no I, no L, no O
export function atpCode({ year, grade, subject, week }) {
  const y = YEAR_LETTER[year];
  const w = WEEK_CHAR[week - 1];
  if (!y) throw new Error(`No ATP year letter for ${year}`);
  if (!w) throw new Error(`No ATP week character for week ${week}`);
  return `${y}${grade}${subject[0]}${w}`.toUpperCase();
}

/** True when a code mixes characters a teacher could misread. */
export function hasAmbiguity(code) {
  return [...String(code)].some((c) => AMBIGUOUS.has(c));
}
