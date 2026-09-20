import { buildPdfFilename } from './filename';

const d = new Date(2026, 8, 20); // 20 Sep 2026 (month is 0-based)

test('formats date as YYYYMMDD and joins name with underscores', () => {
  expect(buildPdfFilename('ĐÀO MAI THANH', d)).toBe('20260920_ĐÀO_MAI_THANH_FSP_Waiver.pdf');
});

test('collapses runs of whitespace and trims', () => {
  expect(buildPdfFilename('  Jawad   Abden-Nur\tTaha ', d)).toBe('20260920_Jawad_Abden-Nur_Taha_FSP_Waiver.pdf');
});

test('falls back to NoName when the name is empty', () => {
  expect(buildPdfFilename('', d)).toBe('20260920_NoName_FSP_Waiver.pdf');
  expect(buildPdfFilename('   ', d)).toBe('20260920_NoName_FSP_Waiver.pdf');
});

test('zero-pads month and day', () => {
  expect(buildPdfFilename('A', new Date(2026, 0, 5))).toBe('20260105_A_FSP_Waiver.pdf');
});
