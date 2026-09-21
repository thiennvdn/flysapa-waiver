// Runs OCR entirely in the browser (Tesseract.js, WASM) and parses the result
// with regex/label heuristics. No network calls, no API key, no quota.
//
// Accuracy is inherently lower than Gemini's vision model, especially for
// CCCD field layout, since we're pattern-matching raw OCR text instead of
// asking a model to read the document. The passport MRZ path is the most
// reliable one, since MRZ has a fixed, checksummed format.
import { createWorker } from 'tesseract.js';
import { parse as parseMRZ } from 'mrz';
import { ExtractionError, MAX_FILES, MAX_FILE_BYTES, normalizeDate, normalizeGender, clean, stripDiacritics } from './extraction';

export { ExtractionError, MAX_FILES, MAX_FILE_BYTES };

const MSG = {
  noImage: 'Vui lòng chọn ảnh giấy tờ | Please select a document image',
  unknown:
    'Không nhận diện được giấy tờ, vui lòng thử ảnh rõ hơn | Could not read the document, please try a clearer photo',
};

let workerPromise;
function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng+vie', 1, {
      langPath: `${import.meta.env.BASE_URL}tessdata`,
    });
  }
  return workerPromise;
}

async function recognizeAll(images) {
  const worker = await getWorker();
  const texts = [];
  for (const { mimeType, data } of images) {
    const { data: result } = await worker.recognize(`data:${mimeType};base64,${data}`);
    texts.push(result.text);
  }
  return texts.join('\n');
}

// --- MRZ (passport) -------------------------------------------------------

function candidateMrzLines(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.toUpperCase().replace(/\s+/g, ''))
    .filter((l) => l.length >= 30 && l.length <= 44 && /^[A-Z0-9<]+$/.test(l));
}

function padMrzLine(line, targetLength) {
  return line.length >= targetLength ? line.slice(0, targetLength) : line + '<'.repeat(targetLength - line.length);
}

// Only handles the standard 2-line (TD3) passport MRZ.
export function extractMrzFields(text) {
  const candidates = candidateMrzLines(text);
  if (candidates.length < 2) return null;
  const pair = candidates.slice(-2).map((l) => padMrzLine(l, 44));
  try {
    const result = parseMRZ(pair);
    return result.fields.documentNumber ? result.fields : null;
  } catch {
    return null;
  }
}

export function mrzDateToDisplay(yyMMdd, assumeFuture) {
  if (!yyMMdd || !/^\d{6}$/.test(yyMMdd)) return '';
  const yy = parseInt(yyMMdd.slice(0, 2), 10);
  const mm = yyMMdd.slice(2, 4);
  const dd = yyMMdd.slice(4, 6);
  const currentYY = new Date().getFullYear() % 100;
  const year = assumeFuture ? 2000 + yy : yy > currentYY ? 1900 + yy : 2000 + yy;
  return `${dd}/${mm}/${year}`;
}

export function fieldsFromMrz(mrz) {
  return {
    fullName: `${mrz.lastName ?? ''} ${mrz.firstName ?? ''}`.replace(/\s+/g, ' ').trim(),
    dateOfBirth: mrzDateToDisplay(mrz.birthDate, false),
    dateOfExpiry: mrzDateToDisplay(mrz.expirationDate, true),
    gender: mrz.sex ?? '',
    nationality: mrz.nationality ?? '',
    passportNumber: mrz.documentNumber ?? '',
  };
}

// --- Label-based field extraction (CCCD, and passport fallback) -----------

function findLabelValue(lines, normLines, keywords) {
  for (let i = 0; i < normLines.length; i++) {
    for (const kw of keywords) {
      const idx = normLines[i].indexOf(kw);
      if (idx === -1) continue;
      const after = lines[i]
        .slice(idx + kw.length)
        // labels are printed bilingually ("Giới tính/Sex:"); drop the second
        // language's label if the matched keyword was the first one
        .replace(/^\/[^:]{0,30}:/, '')
        .replace(/^[\s:\/.\-]+/, '')
        .trim();
      if (after) return after;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim()) return lines[j].trim();
      }
    }
  }
  return '';
}

function extractByLabels(text, labelMap) {
  const lines = text.split(/\r?\n/);
  const normLines = lines.map((l) => stripDiacritics(l).toLowerCase());
  const out = {};
  for (const [field, keywords] of Object.entries(labelMap)) {
    out[field] = findLabelValue(lines, normLines, keywords);
  }
  return out;
}

const firstToken = (s) => s.split(/\s+/)[0] ?? '';
const firstDateLike = (s) => s.match(/\d{1,2}[/.-]\d{1,2}[/.-]\d{4}/)?.[0] ?? s;

const CCCD_LABELS = {
  fullName: ['ho va ten', 'full name'],
  dateOfBirth: ['ngay sinh', 'date of birth'],
  gender: ['gioi tinh', 'sex'],
  placeOfBirth: ['que quan', 'place of origin'],
  address: ['noi thuong tru', 'place of residence'],
  dateOfExpiry: ['co gia tri den', 'date of expiry'],
  dateOfIssuance: ['ngay cap'],
};

export function extractCccdFields(text) {
  const fields = extractByLabels(text, CCCD_LABELS);
  const idMatch = text.match(/\b\d{12}\b/);
  return {
    ...fields,
    gender: firstToken(fields.gender),
    dateOfBirth: firstDateLike(fields.dateOfBirth),
    dateOfExpiry: firstDateLike(fields.dateOfExpiry),
    dateOfIssuance: firstDateLike(fields.dateOfIssuance),
    passportNumber: idMatch ? idMatch[0] : '',
  };
}

const PASSPORT_LABELS = {
  fullName: ['surname', 'name'],
  dateOfBirth: ['date of birth'],
  dateOfExpiry: ['date of expiry', 'date of expiration'],
  dateOfIssuance: ['date of issue'],
  placeOfBirth: ['place of birth'],
  nationality: ['nationality'],
  gender: ['sex'],
  passportNumber: ['passport no', 'passport number', 'document no'],
};

export function extractPassportFallback(text) {
  const fields = extractByLabels(text, PASSPORT_LABELS);
  return {
    ...fields,
    gender: firstToken(fields.gender),
    dateOfBirth: firstDateLike(fields.dateOfBirth),
    dateOfExpiry: firstDateLike(fields.dateOfExpiry),
    dateOfIssuance: firstDateLike(fields.dateOfIssuance),
  };
}

// --- Document type detection ------------------------------------------------

export function detectDocumentType(text, hasMrz) {
  const norm = stripDiacritics(text).toLowerCase();
  if (norm.includes('can cuoc') || norm.includes('cong hoa xa hoi chu nghia viet nam')) return 'CCCD';
  if (hasMrz || norm.includes('passport') || norm.includes('ho chieu')) return 'PASSPORT';
  if (/\b\d{12}\b/.test(text)) return 'CCCD';
  return 'UNKNOWN';
}

// --- Normalization (mirrors gemini.js's schema) -----------------------------

export function normalizeExtraction(raw) {
  const type = raw?.documentType;
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

// --- Entry point -------------------------------------------------------------

export async function extractDocumentData(images) {
  if (!images || images.length === 0) throw new ExtractionError(MSG.noImage);

  const text = await recognizeAll(images);
  const mrz = extractMrzFields(text);
  const type = detectDocumentType(text, Boolean(mrz));

  if (type === 'CCCD') {
    return normalizeExtraction({ documentType: 'CCCD', ...extractCccdFields(text) });
  }
  if (type === 'PASSPORT') {
    const fields = mrz ? fieldsFromMrz(mrz) : extractPassportFallback(text);
    return normalizeExtraction({ documentType: 'PASSPORT', ...fields });
  }
  throw new ExtractionError(MSG.unknown);
}
