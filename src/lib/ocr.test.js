import { describe, expect, test } from 'vitest';
import {
  ExtractionError,
  detectDocumentType,
  extractCccdFields,
  extractMrzFields,
  extractPassportFallback,
  fieldsFromMrz,
  mrzDateToDisplay,
  normalizeExtraction,
} from './ocr';

function td3Line2({ documentNumber, checkDigit, nationality, birthDate, sex, expirationDate }) {
  const segs = [documentNumber, checkDigit, nationality, birthDate, '0', sex, expirationDate, '0', '<'.repeat(14), '<', '<'];
  return segs.join('');
}

const PASSPORT_MRZ = [
  'P<USADOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
  td3Line2({
    documentNumber: 'L898902C3',
    checkDigit: '6',
    nationality: 'USA',
    birthDate: '900101',
    sex: 'M',
    expirationDate: '300101',
  }),
];

describe('extractMrzFields', () => {
  test('parses a standard 2-line TD3 passport MRZ found among OCR noise', () => {
    const text = `SOME HEADER NOISE\n${PASSPORT_MRZ[0]}\n${PASSPORT_MRZ[1]}\ntrailing junk`;
    const fields = extractMrzFields(text);
    expect(fields).toMatchObject({
      documentNumber: 'L898902C3',
      nationality: 'USA',
      birthDate: '900101',
      sex: 'male',
      expirationDate: '300101',
    });
  });

  test('returns null when fewer than 2 MRZ-shaped lines are present', () => {
    expect(extractMrzFields('Họ và tên: NGUYEN VAN A\nNgày sinh: 01/01/1990')).toBeNull();
  });
});

describe('mrzDateToDisplay', () => {
  test('formats YYMMDD as DD/MM/YYYY, inferring century', () => {
    expect(mrzDateToDisplay('900101', false)).toBe('01/01/1990');
    expect(mrzDateToDisplay('300101', true)).toBe('01/01/2030');
  });
  test('returns empty string for missing/malformed input', () => {
    expect(mrzDateToDisplay('', false)).toBe('');
    expect(mrzDateToDisplay('12345', false)).toBe('');
  });
});

describe('fieldsFromMrz + normalizeExtraction (passport path)', () => {
  test('maps MRZ fields into the schema used by the app', () => {
    const mrz = extractMrzFields(PASSPORT_MRZ.join('\n'));
    const raw = { documentType: 'PASSPORT', ...fieldsFromMrz(mrz) };
    const out = normalizeExtraction(raw);
    expect(out).toEqual({
      fullName: 'DOE JOHN',
      dateOfBirth: '01/01/1990',
      gender: 'M',
      nationality: 'USA',
      passportNumber: 'L898902C3',
      dateOfExpiry: '01/01/2030',
    });
  });
});

describe('detectDocumentType', () => {
  test('recognises CCCD from the Vietnamese header, even with missing diacritics', () => {
    expect(detectDocumentType('CONG HOA XA HOI CHU NGHIA VIET NAM\nDoc lap - Tu do - Hanh phuc', false)).toBe('CCCD');
    expect(detectDocumentType('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', false)).toBe('CCCD');
  });
  test('recognises PASSPORT from an MRZ match or keyword', () => {
    expect(detectDocumentType('anything', true)).toBe('PASSPORT');
    expect(detectDocumentType('REPUBLIC OF X PASSPORT', false)).toBe('PASSPORT');
  });
  test('falls back to a bare 12-digit id number for CCCD', () => {
    expect(detectDocumentType('some noisy text 001099012345 more noise', false)).toBe('CCCD');
  });
  test('returns UNKNOWN when nothing matches', () => {
    expect(detectDocumentType('a random receipt', false)).toBe('UNKNOWN');
  });
});

describe('extractCccdFields', () => {
  test('reads bilingual labelled fields from OCR text, tolerant of missing diacritics', () => {
    const text = [
      'CONG HOA XA HOI CHU NGHIA VIET NAM',
      'So/No.: 001099012345',
      'Ho va ten/Full name: DAO MAI THANH',
      'Ngay sinh/Date of birth: 21/02/1982',
      'Gioi tinh/Sex: Nam Quoc tich/Nationality: Viet Nam',
      'Que quan/Place of origin: Vinh Phuc',
      'Noi thuong tru/Place of residence: Ha Noi',
      'Co gia tri den/Date of expiry: 21/02/2042',
    ].join('\n');
    const fields = extractCccdFields(text);
    expect(fields).toMatchObject({
      fullName: 'DAO MAI THANH',
      dateOfBirth: '21/02/1982',
      gender: 'Nam',
      placeOfBirth: 'Vinh Phuc',
      address: 'Ha Noi',
      dateOfExpiry: '21/02/2042',
      passportNumber: '001099012345',
    });
  });
});

describe('extractPassportFallback', () => {
  test('reads English labelled fields when no MRZ is available', () => {
    const text = ['Surname: SMITH', 'Date of birth: 05 MAY 1990', 'Nationality: BRITISH', 'Sex: F'].join('\n');
    const fields = extractPassportFallback(text);
    expect(fields).toMatchObject({ fullName: 'SMITH', dateOfBirth: '05 MAY 1990', nationality: 'BRITISH', gender: 'F' });
  });
});

describe('normalizeExtraction', () => {
  test('forces Vietnamese nationality and maps address for CCCD', () => {
    const out = normalizeExtraction({ documentType: 'CCCD', fullName: 'A', gender: 'Nam', address: 'Hà Nội' });
    expect(out).toMatchObject({ nationality: 'Việt Nam', vietnameseAddress: 'Hà Nội', gender: 'M' });
  });
  test('throws ExtractionError for UNKNOWN document type', () => {
    expect(() => normalizeExtraction({ documentType: 'UNKNOWN' })).toThrow(ExtractionError);
  });
});
