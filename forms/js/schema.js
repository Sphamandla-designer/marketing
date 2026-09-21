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

export const OBSERVATION_CODES = [
  { code: 'P', label: 'Positive attitude' },
  { code: 'E', label: 'Exceptional effort' },
  { code: 'C', label: 'Concern' },
  { code: 'N', label: 'Not participating' },
];

/** The attendance grid is a slot model: rows are entry slots, not learners. */
const ATTENDANCE_NOTES = [
  'Write the learner’s position number in the A (absent) or L (late) column for that day. Leave unused slots blank.',
];

export const ATP_STATUS = [
  { value: 'completed', label: 'Completed' },
  { value: 'not_completed', label: 'Not completed' },
];

/** Meta (header) fields shared by both forms. */
const META_YEAR = {
  key: 'academicYear', label: 'Academic Year:', kind: 'chars', length: 4,
  charset: 'digit', required: true, placeholder: 'YYYY',
  validate: (v) => (/^\d{4}$/.test(v) && +v >= 2000 && +v <= 2099) ? null : 'Academic year must be a four-digit year (e.g. 2026).',
};
const META_TERM = {
  key: 'term', label: 'Term:', kind: 'chars', length: 1, charset: 'digit', required: true,
  validate: (v) => (/^[1-4]$/.test(v)) ? null : 'Term must be 1, 2, 3 or 4.',
};
/** Guards against position numbers shifting when learners join or leave mid-term. */
const META_CLASS_LIST = {
  key: 'classListDate', label: 'Position numbers as per class list dated:', kind: 'text',
  required: false, maxLength: 20, placeholder: 'DD / MM / YYYY', span: 4,
};
const META_WEEK = {
  key: 'week', label: 'Week (1–10):', kind: 'chars', length: 2, charset: 'digit', required: true,
  validate: (v) => (/^\d{1,2}$/.test(v) && +v >= 1 && +v <= 10) ? null : 'Week must be between 1 and 10.',
};

export const FORMS = {
  register: {
    type: 'register',
    formCode: 'SA-01',
    docPrefix: 'SA01',
    title: 'Register Class Weekly Attendance & Observation',
    shortTitle: 'Register Class',
    fileStem: 'Register-Class',
    codeBoxLines: ['REGISTER CLASS WEEKLY', 'ATTENDANCE & OBSERVATION'],
    /** Which meta fields make up the file identifier. */
    identifierKeys: ['registerClass', 'academicYear', 'term', 'week'],
    meta: {
      rows: [
        [
          { ...META_YEAR, span: 2 },
          { ...META_TERM, span: 1 },
          { ...META_WEEK, span: 1 },
        ],
        [
          { key: 'registerClass', label: 'Register Class:', kind: 'text', required: true, maxLength: 20, span: 2, placeholder: 'e.g. 9A' },
          { key: 'educator', label: 'Educator:', kind: 'text', required: true, maxLength: 60, span: 2, placeholder: 'Educator full name' },
        ],
        [{ ...META_CLASS_LIST }],
      ],
    },
    attendance: {
      letter: 'A',
      title: 'ATTENDANCE',
      subtitle: '(Record absences and late arrivals only)',
      notes: ATTENDANCE_NOTES,
      /** Slots printed in Section A on page 1. */
      defaultRows: 10,
      /** Slots printed in the Section A2 continuation grid on page 2. */
      overflowRows: 12,
      maxRows: 60,
      continueNote: 'More entries? Continue on page 2, Section A2.',
      overflow: {
        letter: 'A2',
        title: 'ATTENDANCE (CONTINUED)',
        subtitle: '(Continued from Section A on page 1)',
      },
    },
    observations: {
      letter: 'B',
      title: 'NOTABLE LEARNER OBSERVATIONS',
      subtitle: '(Positive or concerning behaviour / performance)',
      notes: [
        'Use the learner’s position number from the class list (learner names are on a separate reference list).',
        'Record one observation code (one character) for each day. If no observation, leave the cell blank.',
      ],
      /** 'split' = separate Learner No. and Code sub-columns per day. */
      mode: 'split',
      defaultRows: 10,
      maxRows: 60,
    },
    codeList: { title: 'Observation Code List', subtitle: '(use one character per entry)', style: 'pipes' },
    comments: {
      key: 'comments',
      title: 'ADDITIONAL COMMENTS',
      subtitle: '(Optional)',
      required: false,
      minLines: 4,
      maxLength: 2000,
      style: 'box',
    },
    signOff: {
      letter: null,
      title: 'SIGN-OFF',
      declaration: 'I confirm that the attendance and observations recorded on this form are accurate for the week indicated.',
      educatorLabel: 'Educator',
      hodLabel: 'HOD / Deputy',
    },
  },

  subject: {
    type: 'subject',
    formCode: 'SA-02',
    docPrefix: 'SA02',
    title: 'Subject Weekly Attendance & Observation',
    shortTitle: 'Subject Class',
    fileStem: 'Subject-Class',
    codeBoxLines: ['SUBJECT WEEKLY', 'ATTENDANCE & OBSERVATION'],
    identifierKeys: ['subjectClass', 'academicYear', 'term', 'week'],
    meta: {
      rows: [
        [
          { ...META_YEAR, span: 2 },
          { ...META_TERM, span: 1 },
          { ...META_WEEK, span: 1 },
        ],
        [
          { key: 'subject', label: 'Subject:', kind: 'text', required: true, maxLength: 40, span: 2, placeholder: 'e.g. Mathematics' },
          { key: 'subjectClass', label: 'Subject Class (e.g. 9A G1):', kind: 'text', required: true, maxLength: 20, span: 2, placeholder: 'e.g. 9A G1' },
        ],
        [
          { key: 'educator', label: 'Educator:', kind: 'text', required: true, maxLength: 60, span: 2, placeholder: 'Educator full name' },
          { key: 'dayPeriods', label: 'Day / Period(s):', kind: 'text', required: true, maxLength: 40, span: 2, placeholder: 'e.g. Mon P1–2, Wed P4' },
        ],
        [{ ...META_CLASS_LIST }],
      ],
    },
    attendance: {
      letter: 'A',
      title: 'ATTENDANCE',
      subtitle: '(Record absences and late arrivals only)',
      notes: ATTENDANCE_NOTES,
      defaultRows: 6,
      overflowRows: 8,
      maxRows: 60,
      continueNote: 'More entries? Continue on page 2, Section A2.',
      overflow: {
        letter: 'A2',
        title: 'ATTENDANCE (CONTINUED)',
        subtitle: '(Continued from Section A on page 1)',
      },
    },
    observations: {
      letter: 'B',
      title: 'NOTABLE LEARNER OBSERVATIONS',
      subtitle: '(Use one code per day where applicable)',
      notes: [
        'Use the learner’s position number from the class list (learner names are on a separate reference list).',
        'Record one observation code (one character) for each day. If no observation, leave the cell blank.',
      ],
      /** 'split' = separate Learner No. and Code sub-columns per day. */
      mode: 'split',
      defaultRows: 6,
      maxRows: 60,
    },
    codeList: { title: 'Observation Code List', subtitle: '(use one character per entry)', style: 'equals' },
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
      minLines: 5,
      maxLength: 2000,
      style: 'lines',
    },
    signOff: {
      letter: 'D',
      title: 'SIGN-OFF',
      declaration: 'I confirm that the attendance, observations and ATP information recorded on this form are accurate for the week indicated.',
      educatorLabel: 'Educator',
      hodLabel: 'HOD / Subject Head',
    },
  },
};

export function getForm(type) {
  const f = FORMS[type];
  if (!f) throw new Error(`Unknown form type: ${type}`);
  return f;
}
