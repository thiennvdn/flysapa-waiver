import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  ExtractionError,
  extractDocumentData,
  normalizeDate,
  normalizeExtraction,
} from './gemini';

describe('normalizeDate', () => {
  test('keeps DD/MM/YYYY', () => {
    expect(normalizeDate('21/02/1982')).toBe('21/02/1982');
  });
  test('converts DD MMM YYYY (passport style)', () => {
    expect(normalizeDate('02 MAR 2002')).toBe('02/03/2002');
    expect(normalizeDate('31 May 2033')).toBe('31/05/2033');
  });
  test('converts ISO YYYY-MM-DD', () => {
    expect(normalizeDate('2024-01-18')).toBe('18/01/2024');
  });
  test('pads single-digit day/month in D/M/YYYY', () => {
    expect(normalizeDate('5/1/2026')).toBe('05/01/2026');
  });
  test('returns trimmed input when unparseable, empty for empty', () => {
    expect(normalizeDate(' unknown ')).toBe('unknown');
    expect(normalizeDate('')).toBe('');
    expect(normalizeDate(undefined)).toBe('');
  });
});

describe('normalizeExtraction', () => {
  test('CCCD: forces nationality, maps address, keeps diacritics', () => {
    const out = normalizeExtraction({
      documentType: 'CCCD',
      fullName: ' ĐÀO MAI THANH ',
      dateOfBirth: '21/02/1982',
      placeOfBirth: 'Triệu Đề, Lập Thạch, Vĩnh Phúc',
      gender: 'Nữ',
      nationality: 'Vietnamese',
      passportNumber: '026182015285',
      dateOfIssuance: '18/01/2024',
      dateOfExpiry: '21/02/2042',
      address: 'Tổ 3 Phúc Đồng, Long Biên, Hà Nội',
    });
    expect(out).toEqual({
      fullName: 'ĐÀO MAI THANH',
      dateOfBirth: '21/02/1982',
      placeOfBirth: 'Triệu Đề, Lập Thạch, Vĩnh Phúc',
      gender: 'F',
      nationality: 'Việt Nam',
      passportNumber: '026182015285',
      dateOfIssuance: '18/01/2024',
      dateOfExpiry: '21/02/2042',
      vietnameseAddress: 'Tổ 3 Phúc Đồng, Long Biên, Hà Nội',
    });
  });

  test('PASSPORT: normalises dates, does not set address', () => {
    const out = normalizeExtraction({
      documentType: 'PASSPORT',
      fullName: 'JAWAD ABDEN-NUR TAHA',
      dateOfBirth: '02 MAR 2002',
      placeOfBirth: 'ZAMBOANGA CITY',
      gender: 'male',
      nationality: 'FILIPINO',
      passportNumber: 'P4286420C',
      dateOfIssuance: '01 JUN 2023',
      dateOfExpiry: '31 MAY 2033',
      address: '',
    });
    expect(out).toEqual({
      fullName: 'JAWAD ABDEN-NUR TAHA',
      dateOfBirth: '02/03/2002',
      placeOfBirth: 'ZAMBOANGA CITY',
      gender: 'M',
      nationality: 'FILIPINO',
      passportNumber: 'P4286420C',
      dateOfIssuance: '01/06/2023',
      dateOfExpiry: '31/05/2033',
    });
    expect(out).not.toHaveProperty('vietnameseAddress');
  });

  test('omits empty fields and unknown gender', () => {
    const out = normalizeExtraction({ documentType: 'PASSPORT', fullName: 'X', gender: '?', dateOfBirth: '' });
    expect(out).toEqual({ fullName: 'X' });
  });

  test('throws ExtractionError for UNKNOWN document type', () => {
    expect(() => normalizeExtraction({ documentType: 'UNKNOWN' })).toThrow(ExtractionError);
  });
});

describe('extractDocumentData', () => {
  const images = [{ mimeType: 'image/jpeg', data: 'AAAA' }];
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function okResponse(obj) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }),
    };
  }

  test('posts images + prompt to gemini-3.5-flash-lite with JSON schema and returns normalised data', async () => {
    fetch.mockResolvedValue(okResponse({ documentType: 'CCCD', fullName: 'A B', gender: 'M' }));
    const out = await extractDocumentData('KEY123', images);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=KEY123');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.contents[0].parts[0]).toEqual({ inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } });
    expect(body.contents[0].parts[1].text).toMatch(/Căn cước công dân/);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseSchema.properties.documentType.enum).toEqual(['CCCD', 'PASSPORT', 'UNKNOWN']);
    expect(out).toEqual({ fullName: 'A B', gender: 'M', nationality: 'Việt Nam' });
  });

  test('maps HTTP errors to ExtractionError with Google message', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'API key not valid' } }),
    });
    await expect(extractDocumentData('bad', images)).rejects.toMatchObject({
      name: 'ExtractionError',
      userMessage: expect.stringContaining('API key not valid'),
    });
  });

  test('maps unparsable JSON to ExtractionError', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] }),
    });
    await expect(extractDocumentData('k', images)).rejects.toBeInstanceOf(ExtractionError);
  });

  test('rejects when no images or missing key without calling fetch', async () => {
    await expect(extractDocumentData('', images)).rejects.toBeInstanceOf(ExtractionError);
    await expect(extractDocumentData('k', [])).rejects.toBeInstanceOf(ExtractionError);
    expect(fetch).not.toHaveBeenCalled();
  });
});
