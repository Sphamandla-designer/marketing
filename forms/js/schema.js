/**
 * Shared form definitions for the Register Class and Subject Class forms.
 *
 * This is the single source of truth. Both the interactive web form
 * (form-ui.js) and the submission document (layout.js → PDF + PNG) are
 * generated from these definitions, so they can never drift apart.
 */

export const SCHOOL = {
  name: 'FISANTEKRAAL HIGH SCHOOL',
  motto: 'LEARN · GROW · CONTRIBUTE',
  mottoWords: ['Learn', 'Grow', 'Contribute'],
  tagline: 'Quality Education for a Brighter Tomorrow',
};

export const DAYS = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
];

/** Period slots recorded per day in the attendance grid's Period row. */
export const PERIOD_SLOTS = 2;

export const OBSERVATION_CODES = [
  { code: 'P', label: 'Positive attitude' },
  { code: 'E', label: 'Exceptional effort' },
  { code: 'C', label: 'Concern' },
  { code: 'N', label: 'Not participating' },
];

/** The attendance grid is a slot model: rows are entry slots, not learners. */
const ATTENDANCE_NOTES = [
  'Write the learner’s position number in the A (absent) or L (late) column. Leave unused slots blank.',
];
const OBSERVATION_NOTES = [
  'Use the learner’s position number and one observation code per day. Leave blank if there is nothing to record.',
];
/** Printed under the masthead in place of the motto and tagline. */
const HEADER_PERIOD = '2026 · Term 2';

export const ATP_STATUS = [
  { value: 'completed', label: 'Completed' },
  { value: 'not_completed', label: 'Not completed' },
];

/** Meta (header) fields shared by both forms. */
const META_DATE = {
  key: 'date', label: 'Date:', kind: 'text',
  required: false, maxLength: 20, placeholder: 'DD / MM / YYYY', span: 3,
};
const META_WEEK = {
  key: 'week', label: 'Week:', kind: 'chars', length: 2, charset: 'digit',
  required: true, span: 2, alignRight: true,
  validate: (v) => (/^\d{1,2}$/.test(v) && +v >= 1 && +v <= 10) ? null : 'Week must be between 1 and 10.',
};
const META_EDUCATOR = {
  key: 'educator', label: 'Educator:', kind: 'text',
  required: true, maxLength: 60, placeholder: 'Educator full name', span: 4,
};

/**
 * Both forms carry the same observation codes, so the list is defined once and
 * printed inside Section B on each.
 */
export const CODE_LIST = { title: 'Observation Code List', subtitle: '(the same on both forms — one character per entry)' };

/**
 * The sign-off block. The term is printed in the masthead and the week is a
 * header field, so nothing is captured here but the educator's signature.
 */
const SIGN_OFF = (declaration) => ({
  letter: null,
  title: 'SIGN-OFF',
  declaration,
  educatorLabel: 'Educator',
  fields: [],
  dates: [],
});

export const FORMS = {
  register: {
    type: 'register',
    formCode: 'SA-01',
    docPrefix: 'SA01',
    title: 'Register Class Weekly Attendance & Observation',
    shortTitle: 'Register Class',
    fileStem: 'Register-Class',
    codeBoxLines: ['REGISTER CLASS WEEKLY', 'ATTENDANCE & OBSERVATION'],
    headerTitle: 'REGISTER CLASS ATTENDANCE',
    headerPeriod: HEADER_PERIOD,
    /** Term and week now live in the sign-off, so the identifier reads from there. */
    identifierKeys: ['registerClass'],
    meta: {
      rows: [
        [
          { key: 'registerClass', label: 'Register Class:', kind: 'text', required: true, maxLength: 20, span: 3, placeholder: 'e.g. 9A' },
          { ...META_WEEK },
          { ...META_DATE },
        ],
        [{ ...META_EDUCATOR }],
      ],
    },
    attendance: {
      letter: 'A',
      title: 'ATTENDANCE',
      subtitle: '(Record absences and late arrivals only)',
      notes: ATTENDANCE_NOTES,
      /** Entry slots printed in Section A. The form is one page: it does not overflow. */
      defaultRows: 8,
      maxRows: 8,
      /** Per-day period row printed above the A / L header. */
      periodRow: { label: 'Period', slots: 2 },
    },
    observations: {
      letter: 'B',
      title: 'NOTABLE LEARNER OBSERVATIONS',
      subtitle: '(Positive or concerning behaviour / performance)',
      notes: OBSERVATION_NOTES,
      /** 'split' = separate Learner No. and Code sub-columns per day. */
      mode: 'split',
      defaultRows: 8,
      maxRows: 8,
    },
    comments: {
      key: 'comments',
      title: 'ADDITIONAL COMMENTS',
      subtitle: '(Optional)',
      required: false,
      minLines: 3,
      maxLength: 600,
      style: 'box',
    },
    signOff: SIGN_OFF('I confirm that the attendance and observations recorded on this form are accurate for the week indicated.'),
  },

  subject: {
    type: 'subject',
    formCode: 'SA-02',
    docPrefix: 'SA02',
    title: 'Subject Weekly Attendance & Observation',
    shortTitle: 'Subject Class',
    fileStem: 'Subject-Class',
    codeBoxLines: ['SUBJECT WEEKLY', 'ATTENDANCE & OBSERVATION'],
    headerTitle: 'SUBJECT CLASS ATTENDANCE',
    headerPeriod: HEADER_PERIOD,
    identifierKeys: ['subjectClass'],
    meta: {
      rows: [
        // Day / Period(s) used to live here; the per-day Period row above the
        // attendance grid records it more precisely, so it is not repeated.
        [
          { key: 'subject', label: 'Subject:', kind: 'text', required: true, maxLength: 40, span: 3, placeholder: 'e.g. Mathematics' },
          { key: 'subjectClass', label: 'Subject Class:', kind: 'text', required: true, maxLength: 20, span: 3, placeholder: 'e.g. 9A G1' },
          { ...META_WEEK },
          { ...META_DATE },
        ],
        [{ ...META_EDUCATOR }],
      ],
    },
    attendance: {
      letter: 'A',
      title: 'ATTENDANCE',
      subtitle: '(Record absences and late arrivals only)',
      notes: ATTENDANCE_NOTES,
      defaultRows: 6,
      maxRows: 6,
      periodRow: { label: 'Period', slots: 2 },
    },
    observations: {
      letter: 'B',
      title: 'NOTABLE LEARNER OBSERVATIONS',
      subtitle: '(Use one code per day where applicable)',
      notes: OBSERVATION_NOTES,
      /** 'split' = separate Learner No. and Code sub-columns per day. */
      mode: 'split',
      defaultRows: 6,
      maxRows: 6,
    },
    atp: {
      letter: 'C',
      title: 'ATP REFERENCE AND COMPLETION',
      codeLabel: 'ATP Code (from term master sheet):',
      codeMaxLength: 24,
      commentsLabel: 'Educator comments / explanation',
      commentsHint: '(e.g. deviation, focus for next week, additional notes):',
    },
    comments: {
      key: 'comments',
      title: null, // rendered inside section C
      required: false,
      minLines: 6,
      maxLength: 600,
      style: 'lines',
    },
    signOff: { ...SIGN_OFF('I confirm that the attendance, observations and ATP information recorded on this form are accurate for the week indicated.'), letter: 'D' },
  },
};

export function getForm(type) {
  const f = FORMS[type];
  if (!f) throw new Error(`Unknown form type: ${type}`);
  return f;
}
