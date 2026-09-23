// Calls Gemini directly from the browser (no backend). The key is injected at
// build time (see DocumentUpload) and is only ever sent to Google.
const MODEL = 'gemini-3.5-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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

const MSG = {
  noKey: 'Vui lòng nhập Gemini API key | Please enter your Gemini API key',
  noImage: 'Vui lòng chọn ảnh giấy tờ | Please select a document image',
  unknown:
    'Không nhận diện được giấy tờ, vui lòng thử ảnh rõ hơn | Could not read the document, please try a clearer photo',
  network: 'Không kết nối được tới Gemini | Could not reach Gemini',
};

const PROMPT = `The image(s) show either a Vietnamese Citizen Identity Card (Căn cước công dân / CCCD — possibly a screenshot from the VNeID app, where "Ngày cấp" (date of issue) appears as a text row below the card image) or a passport from any country (possibly front + back or multiple pages).
Identify the document type and extract the holder's personal information into the JSON schema.
Rules:
- documentType: "CCCD" for a Vietnamese Citizen Identity Card, "PASSPORT" for a passport, "UNKNOWN" if neither is visible.
- For CCCD: fullName = "Họ và tên / Full name" exactly as printed (keep UPPERCASE and Vietnamese diacritics); passportNumber = "Số / No."; dateOfBirth = "Ngày sinh"; gender from "Giới tính / Sex" (Nam = M, Nữ = F); nationality = "Việt Nam"; placeOfBirth = "Quê quán / Place of origin"; address = "Nơi thường trú / Place of residence"; dateOfExpiry = "Có giá trị đến / Date of expiry"; dateOfIssuance = "Ngày cấp" if visible anywhere (front, back, or the VNeID text row), otherwise "".
- For PASSPORT: fullName = surname + given names + middle name as printed (UPPERCASE); passportNumber = passport number; dateOfBirth, dateOfIssuance ("Date of issue"), dateOfExpiry ("Date of expiry / Valid until"), placeOfBirth, nationality exactly as printed; gender from Sex; address = "". Cross-check numbers and dates with the MRZ lines if present.
- All dates strictly as DD/MM/YYYY (convert month names, e.g. "02 MAR 2002" -> "02/03/2002").
- gender must be exactly "M" or "F", or "" if not visible.
- Use "" for any field that is not visible. Never invent values.`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    documentType: { type: 'STRING', enum: ['CCCD', 'PASSPORT', 'UNKNOWN'] },
    fullName: { type: 'STRING' },
    dateOfBirth: { type: 'STRING' },
    placeOfBirth: { type: 'STRING' },
    gender: { type: 'STRING' },
    nationality: { type: 'STRING' },
    passportNumber: { type: 'STRING' },
    dateOfIssuance: { type: 'STRING' },
    dateOfExpiry: { type: 'STRING' },
    address: { type: 'STRING' },
  },
  required: ['documentType'],
};

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

function normalizeGender(input) {
  const s = (input ?? '').toString().trim().toLowerCase();
  if (['m', 'male', 'nam'].includes(s)) return 'M';
  if (['f', 'female', 'nữ', 'nu'].includes(s)) return 'F';
  return '';
}

const clean = (v) => (v ?? '').toString().trim();

// Turns the raw Gemini JSON into a partial formData object with only
// non-empty fields (App clears the document fields before merging).
export function normalizeExtraction(raw) {
  const type = clean(raw?.documentType).toUpperCase();
  if (type !== 'CCCD' && type !== 'PASSPORT') {
    throw new ExtractionError(MSG.unknown);
  }
  const out = {
    fullName: clean(raw.fullName),
    dateOfBirth: normalizeDate(raw.dateOfBirth),
    placeOfBirth: clean(raw.placeOfBirth),
    gender: normalizeGender(raw.gender),
    nationality: type === 'CCCD' ? 'Việt Nam' : clean(raw.nationality),
    passportNumber: clean(raw.passportNumber),
    dateOfIssuance: normalizeDate(raw.dateOfIssuance),
    dateOfExpiry: normalizeDate(raw.dateOfExpiry),
  };
  if (type === 'CCCD') out.vietnameseAddress = clean(raw.address);
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== ''));
}

export async function extractDocumentData(apiKey, images) {
  if (!apiKey) throw new ExtractionError(MSG.noKey);
  if (!images || images.length === 0) throw new ExtractionError(MSG.noImage);

  const body = {
    contents: [
      {
        parts: [
          ...images.map(({ mimeType, data }) => ({ inlineData: { mimeType, data } })),
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0,
    },
  };

  let res;
  try {
    res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new ExtractionError(MSG.network, err);
  }

  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error?.message ?? '';
    } catch {
      /* ignore */
    }
    throw new ExtractionError(`Gemini lỗi | Gemini error (${res.status}): ${detail || res.statusText || ''}`.trim());
  }

  let raw;
  try {
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    raw = JSON.parse(text);
  } catch (err) {
    throw new ExtractionError(MSG.unknown, err);
  }
  return normalizeExtraction(raw);
}
