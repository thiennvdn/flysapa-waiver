// Shared, backend-agnostic helpers used by both the Gemini and the offline
// OCR extraction pipelines, so the two stay consistent in output shape.
export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 8 * 1024 * 1024;

export class ExtractionError extends Error {
  constructor(userMessage, cause) {
    super(userMessage);
    this.name = 'ExtractionError';
    this.userMessage = userMessage;
    this.cause = cause;
  }
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

const pad2 = (n) => String(n).padStart(2, '0');

export function normalizeDate(input) {
  const s = (input ?? '').toString().trim();
  if (!s) return '';
  let m;
  if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) {
    return `${pad2(m[1])}/${pad2(m[2])}/${m[3]}`;
  }
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    return `${pad2(m[3])}/${pad2(m[2])}/${m[1]}`;
  }
  if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})$/))) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month) return `${pad2(m[1])}/${pad2(month)}/${m[3]}`;
  }
  return s;
}

export function normalizeGender(input) {
  const s = (input ?? '').toString().trim().toLowerCase();
  if (['m', 'male', 'nam'].includes(s)) return 'M';
  if (['f', 'female', 'nữ', 'nu'].includes(s)) return 'F';
  return '';
}

export const clean = (v) => (v ?? '').toString().trim();

// Removes Vietnamese diacritics so OCR text (which frequently drops or
// mis-reads accents) can still be matched against known field labels.
export function stripDiacritics(input) {
  return (input ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}
