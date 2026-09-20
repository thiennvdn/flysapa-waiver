# FlySapa Waiver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static React app on GitHub Pages that auto-fills a bilingual paragliding registration/waiver form from a CCCD or passport photo (via Gemini) and exports it as a two-page A4 PDF.

**Architecture:** Single-page Vite + React app. `src/lib/` holds pure, testable modules (filename, Gemini extraction/normalisation, PDF export); `src/components/` holds presentational form pieces mirroring the reference app; `App.jsx` owns `formData` state and wires the upload card, the two A4 page cards and the export button together. No backend: the user's Gemini key lives in `localStorage` and requests go straight to Google.

**Tech Stack:** Vite 8, React 19, Tailwind CSS **3.4** (v4 emits `oklch()` colors that html2canvas 1.4.1 cannot parse), jspdf 4, html2canvas 1.4.1, Vitest 5 + jsdom + Testing Library, GitHub Actions → GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-20-flysapa-waiver-design.md`

## Global Constraints

- All user-visible copy is bilingual `Tiếng Việt | English`; form labels must match the spec §5 strings exactly (they are what appears in the PDF).
- Form state keys (17) exactly as spec §4.
- PDF file name: `${yyyy}${mm}${dd}_${name}_FSP_Waiver.pdf`, `name` = full name trimmed, whitespace runs → `_`, diacritics kept, fallback `NoName`.
- Gemini model: `gemini-2.5-flash`, endpoint `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=<key>`.
- Never commit anything from `.docs/` (real personal IDs). `.gitignore` already excludes it.
- Vite `base` is `/flysapa-waiver/`.
- Commit after every task with the trailer `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Run commands from the repo root `C:\ThienNV\Personal\flysapa-waiver` (Windows; use PowerShell or Git Bash).

---

### Task 1: Project scaffold (Vite + React + Tailwind 3 + Vitest)

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/test/setup.js`, `src/App.test.jsx`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test` (vitest run), `npm run test:watch`. `App` default export renders the text `FlySapa`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "flysapa-waiver",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "react": "^19.3.0",
    "react-dom": "^19.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@testing-library/user-event": "^14.6.7",
    "@vitejs/plugin-react": "^6.1.1",
    "autoprefixer": "^10.4.21",
    "jsdom": "^30.1.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.19",
    "vite": "^8.3.0",
    "vitest": "^5.0.1"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/flysapa-waiver/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
});
```

- [ ] **Step 3: Create `tailwind.config.js` and `postcss.config.js`**

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
```

`postcss.config.js`:
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FlySapa – Mẫu đăng ký bay | Registration Form</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-gray-200">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/index.css`, `src/main.jsx`, `src/App.jsx`**

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
  50% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0); }
}
.pulsating-border { animation: pulse-border 2s infinite; }
```

`src/main.jsx`:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.jsx` (placeholder, replaced in Task 4):
```jsx
export default function App() {
  return <div className="p-8 text-center">FlySapa</div>;
}
```

- [ ] **Step 6: Create `src/test/setup.js` and a smoke test `src/App.test.jsx`**

`src/test/setup.js`:
```js
import '@testing-library/jest-dom/vitest';
```

`src/App.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app shell', () => {
  render(<App />);
  expect(screen.getByText(/FlySapa/)).toBeInTheDocument();
});
```

- [ ] **Step 7: Install and run**

Run: `npm install`
Run: `npm test`
Expected: `1 passed`.
Run: `npm run build`
Expected: `dist/` created without errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.js tailwind.config.js postcss.config.js index.html src
git commit -m "chore: scaffold Vite + React + Tailwind 3 + Vitest

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: PDF file name helper

**Files:**
- Create: `src/lib/filename.js`, `src/lib/filename.test.js`

**Interfaces:**
- Produces: `buildPdfFilename(fullName: string, date?: Date): string`

- [ ] **Step 1: Write the failing tests**

`src/lib/filename.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/filename.test.js`
Expected: FAIL – cannot resolve `./filename`.

- [ ] **Step 3: Implement `src/lib/filename.js`**

```js
// Builds the PDF file name used by the reference app:
// YYYYMMDD_HO_TEN_FSP_Waiver.pdf (diacritics kept, whitespace -> "_").
export function buildPdfFilename(fullName, date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const name = (fullName || '').trim().replace(/\s+/g, '_') || 'NoName';
  return `${yyyy}${mm}${dd}_${name}_FSP_Waiver.pdf`;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/filename.test.js`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/filename.js src/lib/filename.test.js
git commit -m "feat: add PDF filename helper

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Gemini extraction module (request, normalisation, errors)

**Files:**
- Create: `src/lib/gemini.js`, `src/lib/gemini.test.js`, `src/lib/image.js`

**Interfaces:**
- Produces:
  - `normalizeDate(input: string): string` – returns `DD/MM/YYYY` or the trimmed input if unparseable.
  - `normalizeExtraction(raw: object): Partial<FormData>` – throws `ExtractionError` on `UNKNOWN`.
  - `extractDocumentData(apiKey: string, images: Array<{mimeType: string, data: string}>): Promise<Partial<FormData>>`
  - `class ExtractionError extends Error` with `.userMessage` (bilingual string).
  - `fileToResizedBase64(file: File, maxPx = 1600): Promise<{mimeType: string, data: string}>` (in `image.js`, browser-only, not unit tested).
  - Constants `MAX_FILES = 3`, `MAX_FILE_BYTES = 8 * 1024 * 1024`.

- [ ] **Step 1: Write the failing tests**

`src/lib/gemini.test.js`:
```js
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

  test('posts images + prompt to gemini-2.5-flash with JSON schema and returns normalised data', async () => {
    fetch.mockResolvedValue(okResponse({ documentType: 'CCCD', fullName: 'A B', gender: 'M' }));
    const out = await extractDocumentData('KEY123', images);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=KEY123');
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/gemini.test.js`
Expected: FAIL – cannot resolve `./gemini`.

- [ ] **Step 3: Implement `src/lib/gemini.js`**

```js
// Calls Gemini directly from the browser (no backend). The key is the end
// user's own key and is only ever sent to Google.
const MODEL = 'gemini-2.5-flash';
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
  if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/))) {
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
// non-empty fields, so merging never wipes what the user already typed.
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
```

- [ ] **Step 4: Implement `src/lib/image.js`** (browser only; exercised manually)

```js
// Downscales a photo before upload: VNeID screenshots and phone photos are
// 3-4k px, which costs tokens and time without improving OCR.
export function fileToResizedBase64(file, maxPx = 1600) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve({ mimeType: 'image/jpeg', data: dataUrl.split(',')[1] });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Cannot read image ${file.name}`));
    };
    img.src = url;
  });
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/lib/gemini.test.js`
Expected: all tests pass (5 + 4 + 4 = 13).

- [ ] **Step 6: Commit**

```bash
git add src/lib/gemini.js src/lib/gemini.test.js src/lib/image.js
git commit -m "feat: Gemini document extraction with normalisation

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Form pages and App state (no upload/PDF yet)

**Files:**
- Create: `src/components/InputField.jsx`, `src/components/SectionTitle.jsx`, `src/components/WaiverText.jsx`, `src/components/PageHeader.jsx`, `src/components/PageFooter.jsx`, `src/components/RegistrationPage.jsx`, `src/components/WaiverPage.jsx`, `src/formData.js`
- Modify: `src/App.jsx`, `src/App.test.jsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `EMPTY_FORM` (object with the 17 keys, all `''`) from `src/formData.js`.
  - `<RegistrationPage formData onChange onGenderChange isPdfMode ref />` (page 1, `forwardRef` to the outer card div).
  - `<WaiverPage formData onChange isPdfMode ref />` (page 2).
  - `<InputField label name value onChange type placeholder readOnly inputClassName isPdfMode />`.
  - `App` holds `formData`, `isPdfMode`, `isProcessing` state and refs `page1Ref`, `page2Ref`.

- [ ] **Step 1: Write the failing test** (replace `src/App.test.jsx`)

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const LABELS = [
  'Họ và tên | Full name',
  'Nơi sinh | Place of Birth',
  'Giới tính | Gender',
  'Ngày sinh | Date of Birth (DD/MM/YYYY)',
  'Quốc tịch | Nationality',
  'Số giấy tờ tuỳ thân | Passport Number',
  'Ngày cấp | Date of Issuance',
  'Ngày hết hạn | Date of Expiry',
  'Địa chỉ | Vietnamese address',
  'Số điện thoại | Phone number',
  'E-mail | Email',
  'Quan hệ | Relationship',
  'Số điện thoại | Mobile phone',
  'Ký tên | Signature',
  'Ngày | Date',
];

test('renders headers, titles and every bilingual label', () => {
  render(<App />);
  expect(screen.getByText('MẪU ĐĂNG KÝ BAY | Registration Form')).toBeInTheDocument();
  expect(screen.getByText('THOẢ THUẬN MIỄN TRỪ TRÁCH NHIỆM | Waiver Agreement')).toBeInTheDocument();
  expect(screen.getByText('Thông tin cá nhân | Personal Information')).toBeInTheDocument();
  expect(screen.getByText('Người liên hệ trong trường hợp khẩn cấp/ Contact in case of emergency')).toBeInTheDocument();
  expect(screen.getAllByText('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM').length).toBe(1);
  for (const label of LABELS) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
  expect(screen.getByText(/1 \| Page CÔNG TY TNHH DU LỊCH THỂ THAO MÂY/)).toBeInTheDocument();
  expect(screen.getByText(/2 \| Page CÔNG TY TNHH DU LỊCH THỂ THAO MÂY/)).toBeInTheDocument();
});

test('typing updates a field and gender radios toggle', async () => {
  const user = userEvent.setup();
  render(<App />);
  const name = screen.getByLabelText('Họ và tên | Full name', { selector: '#fullName' });
  await user.type(name, 'ĐÀO MAI THANH');
  expect(name).toHaveValue('ĐÀO MAI THANH');

  const female = screen.getByLabelText('Nữ | F');
  await user.click(female);
  expect(female).toBeChecked();
  expect(screen.getByLabelText('Nam | M')).not.toBeChecked();
});

test('signature boxes are read-only', () => {
  render(<App />);
  expect(screen.getByLabelText('Ký tên | Signature')).toHaveAttribute('readonly');
  expect(screen.getByLabelText('Ngày | Date')).toHaveAttribute('readonly');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/App.test.jsx`
Expected: FAIL – titles not found.

- [ ] **Step 3: Create `src/formData.js`**

```js
export const EMPTY_FORM = {
  fullName: '',
  dateOfBirth: '',
  placeOfBirth: '',
  gender: '',
  nationality: '',
  passportNumber: '',
  dateOfIssuance: '',
  dateOfExpiry: '',
  vietnameseAddress: '',
  phoneNumber: '',
  email: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  emergencyContactEmail: '',
  signature: '',
  signatureDate: '',
};
```

- [ ] **Step 4: Create the small components**

`src/components/InputField.jsx`:
```jsx
// In PDF mode the real <input> text is made transparent and an overlay div
// shows the value: html2canvas renders plain divs far more faithfully than
// form controls.
export default function InputField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  readOnly = false,
  inputClassName = '',
  isPdfMode = false,
}) {
  const base =
    'block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 read-only:bg-gray-100 read-only:cursor-not-allowed';
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`${base} ${inputClassName}`}
          style={isPdfMode ? { color: 'transparent', caretColor: 'transparent' } : undefined}
        />
        {isPdfMode && value && (
          <div
            className={`absolute inset-0 flex items-center px-3 py-2 bg-white border border-gray-300 sm:text-sm text-gray-900 pointer-events-none rounded-md ${inputClassName}`}
          >
            {value}
          </div>
        )}
      </div>
    </div>
  );
}
```

`src/components/SectionTitle.jsx`:
```jsx
export default function SectionTitle({ title }) {
  return <h2 className="text-lg font-semibold text-gray-800 my-6 pb-2 border-b border-gray-200">{title}</h2>;
}
```

`src/components/WaiverText.jsx`:
```jsx
export default function WaiverText({ vietnamese, english }) {
  return (
    <div className="mb-4 text-sm text-gray-800">
      <p className="font-semibold">{vietnamese}</p>
      <p className="italic mt-1">{english}</p>
    </div>
  );
}
```

`src/components/PageHeader.jsx`:
```jsx
export default function PageHeader() {
  return (
    <div className="grid grid-cols-2 items-start text-sm font-semibold text-gray-800 gap-x-8">
      <div className="text-center">
        <p>CÔNG TY TNHH DU LỊCH</p>
        <p>THỂ THAO MÂY</p>
      </div>
      <div className="text-center">
        <p>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="border-b-2 border-black inline-block px-4 pb-1">Độc lập – Tự do – Hạnh Phúc</p>
      </div>
    </div>
  );
}
```

`src/components/PageFooter.jsx`:
```jsx
export default function PageFooter({ page }) {
  return (
    <div className="text-center text-xs text-gray-600 pt-2 mt-auto border-t border-gray-200">
      {page} | Page CÔNG TY TNHH DU LỊCH THỂ THAO MÂY - MẪU ĐĂNG KÝ / MIỄN TRỪ
    </div>
  );
}
```

- [ ] **Step 5: Create `src/components/RegistrationPage.jsx`**

```jsx
import { forwardRef } from 'react';
import InputField from './InputField';
import SectionTitle from './SectionTitle';
import PageHeader from './PageHeader';
import PageFooter from './PageFooter';

function GenderRadio({ id, value, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer text-sm text-gray-900">
      <input type="radio" id={id} name="gender" value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`w-4 h-4 inline-flex items-center justify-center rounded-full border-2 ${
          checked ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
        }`}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
      </span>
      <span className="ml-2">{label}</span>
    </label>
  );
}

const RegistrationPage = forwardRef(function RegistrationPage({ formData, onChange, onGenderChange, isPdfMode }, ref) {
  const field = (label, name, extra = {}) => (
    <InputField label={label} name={name} value={formData[name]} onChange={onChange} isPdfMode={isPdfMode} {...extra} />
  );
  return (
    <div ref={ref} className="p-8 md:p-12 min-h-[1056px] flex flex-col bg-white shadow-lg rounded-lg">
      <PageHeader />
      <div className="flex-grow">
        <h1 className="text-2xl font-bold text-center my-8 text-gray-800">MẪU ĐĂNG KÝ BAY | Registration Form</h1>

        <SectionTitle title="Thông tin cá nhân | Personal Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {field('Họ và tên | Full name', 'fullName')}
          {field('Nơi sinh | Place of Birth', 'placeOfBirth')}
          <div>
            <span className="block text-sm font-medium text-gray-700">Giới tính | Gender</span>
            <div className="mt-2 flex items-center space-x-6">
              <GenderRadio id="gender-m" value="M" label="Nam | M" checked={formData.gender === 'M'} onChange={onGenderChange} />
              <GenderRadio id="gender-f" value="F" label="Nữ | F" checked={formData.gender === 'F'} onChange={onGenderChange} />
            </div>
          </div>
          {field('Ngày sinh | Date of Birth (DD/MM/YYYY)', 'dateOfBirth')}
          {field('Quốc tịch | Nationality', 'nationality')}
          {field('Số giấy tờ tuỳ thân | Passport Number', 'passportNumber')}
          {field('Ngày cấp | Date of Issuance', 'dateOfIssuance')}
          {field('Ngày hết hạn | Date of Expiry', 'dateOfExpiry')}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {field('Địa chỉ | Vietnamese address', 'vietnameseAddress')}
          {field('Số điện thoại | Phone number', 'phoneNumber', { type: 'tel' })}
          {field('E-mail | Email', 'email', { type: 'email' })}
        </div>

        <SectionTitle title="Người liên hệ trong trường hợp khẩn cấp/ Contact in case of emergency" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {field('Họ và tên | Full name', 'emergencyContactName')}
          {field('Quan hệ | Relationship', 'emergencyContactRelationship')}
          {field('Số điện thoại | Mobile phone', 'emergencyContactPhone', { type: 'tel' })}
          {field('E-mail | Email', 'emergencyContactEmail', { type: 'email' })}
        </div>

        <div className="mt-8 text-sm text-gray-800">
          <p className="font-semibold">
            Tôi cam đoan rằng tất cả thông tin tôi cung cấp trong bản cam kết này là đầy đủ, chính xác và trung thực theo hiểu biết của tôi.
          </p>
          <p className="italic mt-1">
            I warrant that all information provided in this waiver is complete, accurate, and truthful to the best of my knowledge.
          </p>
        </div>
      </div>
      <PageFooter page={1} />
    </div>
  );
});

export default RegistrationPage;
```

- [ ] **Step 6: Create `src/components/WaiverPage.jsx`**

```jsx
import { forwardRef } from 'react';
import InputField from './InputField';
import WaiverText from './WaiverText';
import PageFooter from './PageFooter';

const PARAGRAPHS = [
  {
    vietnamese: 'Tôi tự nguyện tham gia môn chơi dù lượn và tự chịu trách nhiệm cho mọi rủi ro có thể xảy ra với bản thân.',
    english: 'I voluntarily participate in paragliding and assume full responsibility for any risks that may arise to myself.',
  },
  {
    vietnamese:
      'Tôi nhận thức và chấp nhận rằng môn dù lượn là môn thể thao mạo hiểm. Tôi hiểu rằng Công ty không chịu trách nhiệm cho sự an toàn của tôi trong quá trình chuẩn bị, tham gia các hoạt động dù lượn liên quan. Tôi từ bỏ quyền pháp lý và đồng ý miễn trừ trách nhiệm đối với CÔNG TY TNHH DU LỊCH THỂ THAO MÂY, phi công, đại lý, nhân viên hỗ trợ, và các đối tác khác trong trường hợp xảy ra các rủi ro như: tai nạn, chấn thương, thương vong, mất mát, hư hỏng tài sản, tử vong.',
    english:
      'I acknowledge and accept that paragliding is a high-risk sport. I understand that the Company does not assume any responsibility for my safety during the preparation for, participation in any related paragliding activities. I waive any legal rights and agree to hold the Company, its pilots, agents, support staff, and other partners harmless in the event of any risks such as: Accidents, injuries, and fatalities, Loss or damage to property.',
  },
  {
    vietnamese: 'Tôi tự nguyện ký tên và đồng ý với tất cả các điều khoản và điều kiện của Công ty công bố trên website flysapa.com.',
    english: 'I voluntarily sign and agree to all the terms and conditions of the Company as published on the website flysapa.com.',
  },
  {
    vietnamese:
      'Việc ký tên vào bản cam kết này được thực hiện một cách tự nguyện, không bị ép buộc, và với sự hiểu biết đầy đủ về tầm quan trọng của nó. Khi ký vào bản cam kết này, tôi hoàn toàn minh mẫn và tỉnh táo.',
    english:
      'The signing of this waiver is done voluntarily, without coercion, and with a full understanding of its importance. At the time of signing this waiver, I am fully alert and of sound mind.',
  },
];

const WaiverPage = forwardRef(function WaiverPage({ formData, onChange, isPdfMode }, ref) {
  return (
    <div ref={ref} className="p-8 md:p-12 min-h-[1056px] flex flex-col bg-white shadow-lg rounded-lg">
      <div className="flex-grow">
        <h1 className="text-2xl font-bold text-center my-8 text-gray-800">THOẢ THUẬN MIỄN TRỪ TRÁCH NHIỆM | Waiver Agreement</h1>
        {PARAGRAPHS.map((p) => (
          <WaiverText key={p.english} vietnamese={p.vietnamese} english={p.english} />
        ))}
        <p className="text-sm italic mt-4 text-gray-700">
          If you encounter any misunderstandings or unclear meanings in English, please note that Vietnamese is the primary language used in this registration and disclaimer.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField label="Ký tên | Signature" name="signature" value={formData.signature} onChange={onChange} readOnly inputClassName="h-20" isPdfMode={isPdfMode} />
          <InputField label="Ngày | Date" name="signatureDate" value={formData.signatureDate} onChange={onChange} readOnly inputClassName="h-20" isPdfMode={isPdfMode} />
        </div>
      </div>
      <PageFooter page={2} />
    </div>
  );
});

export default WaiverPage;
```

- [ ] **Step 7: Replace `src/App.jsx`**

```jsx
import { useRef, useState } from 'react';
import { EMPTY_FORM } from './formData';
import RegistrationPage from './components/RegistrationPage';
import WaiverPage from './components/WaiverPage';

export default function App() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleGenderChange = (e) => setFormData((prev) => ({ ...prev, gender: e.target.value }));

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="container max-w-4xl mx-auto space-y-8">
        <RegistrationPage ref={page1Ref} formData={formData} onChange={handleChange} onGenderChange={handleGenderChange} isPdfMode={isPdfMode} />
        <WaiverPage ref={page2Ref} formData={formData} onChange={handleChange} isPdfMode={isPdfMode} />
        <div className="text-center pb-4">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <a href="https://flysapa.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">
              FlySapa
            </a>{' '}
            AI
          </p>
        </div>
      </div>
    </div>
  );
}
```

(`isPdfMode`/`isProcessing` setters and refs are consumed in Tasks 5–6; leaving them unused for now is fine.)

- [ ] **Step 8: Run to verify pass**

Run: `npx vitest run src/App.test.jsx`
Expected: 3 passed.
Run: `npm run dev` and open the URL; both A4 cards render with the header, labels, waiver text and footers like the sample PDF. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat: bilingual registration and waiver pages with form state

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Document upload card (API key + images + Extract & Fill)

**Files:**
- Create: `src/components/DocumentUpload.jsx`, `src/components/DocumentUpload.test.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `extractDocumentData`, `ExtractionError`, `MAX_FILES`, `MAX_FILE_BYTES` from `src/lib/gemini.js`; `fileToResizedBase64` from `src/lib/image.js`.
- Produces: `<DocumentUpload onExtracted={(partial) => void} />`. Reads/writes `localStorage['flysapa_gemini_key']`.
- `App` merges the partial: `setFormData(prev => ({ ...prev, ...partial }))` (partial already excludes empty fields).

- [ ] **Step 1: Write the failing tests**

`src/components/DocumentUpload.test.jsx`:
```jsx
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/gemini', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, extractDocumentData: vi.fn() };
});
vi.mock('../lib/image', () => ({
  fileToResizedBase64: vi.fn(async (file) => ({ mimeType: 'image/jpeg', data: `b64-${file.name}` })),
}));

import { extractDocumentData, ExtractionError } from '../lib/gemini';
import DocumentUpload from './DocumentUpload';

const png = (name, size = 10) => new File([new Uint8Array(size)], name, { type: 'image/png' });

beforeEach(() => {
  localStorage.clear();
  extractDocumentData.mockReset();
});
afterEach(() => vi.clearAllMocks());

test('extract button is disabled until key and file are present', async () => {
  const user = userEvent.setup();
  render(<DocumentUpload onExtracted={() => {}} />);
  const button = screen.getByRole('button', { name: /Extract & Fill/ });
  expect(button).toBeDisabled();

  await user.type(screen.getByLabelText(/Gemini API key/), 'abc');
  expect(button).toBeDisabled();

  await user.upload(screen.getByLabelText(/Ảnh giấy tờ/), png('cccd.png'));
  expect(button).toBeEnabled();
});

test('persists the key in localStorage and restores it', async () => {
  const user = userEvent.setup();
  const { unmount } = render(<DocumentUpload onExtracted={() => {}} />);
  await user.type(screen.getByLabelText(/Gemini API key/), 'saved-key');
  expect(localStorage.getItem('flysapa_gemini_key')).toBe('saved-key');
  unmount();
  render(<DocumentUpload onExtracted={() => {}} />);
  expect(screen.getByLabelText(/Gemini API key/)).toHaveValue('saved-key');
});

test('sends resized images with the key and calls onExtracted', async () => {
  const user = userEvent.setup();
  const onExtracted = vi.fn();
  extractDocumentData.mockResolvedValue({ fullName: 'ĐÀO MAI THANH' });
  render(<DocumentUpload onExtracted={onExtracted} />);
  await user.type(screen.getByLabelText(/Gemini API key/), 'k');
  await user.upload(screen.getByLabelText(/Ảnh giấy tờ/), [png('front.png'), png('back.png')]);
  await user.click(screen.getByRole('button', { name: /Extract & Fill/ }));

  await waitFor(() => expect(onExtracted).toHaveBeenCalledWith({ fullName: 'ĐÀO MAI THANH' }));
  expect(extractDocumentData).toHaveBeenCalledWith('k', [
    { mimeType: 'image/jpeg', data: 'b64-front.png' },
    { mimeType: 'image/jpeg', data: 'b64-back.png' },
  ]);
});

test('shows the ExtractionError message and keeps the form untouched', async () => {
  const user = userEvent.setup();
  const onExtracted = vi.fn();
  extractDocumentData.mockRejectedValue(new ExtractionError('Gemini lỗi | Gemini error (400): API key not valid'));
  render(<DocumentUpload onExtracted={onExtracted} />);
  await user.type(screen.getByLabelText(/Gemini API key/), 'bad');
  await user.upload(screen.getByLabelText(/Ảnh giấy tờ/), png('x.png'));
  await user.click(screen.getByRole('button', { name: /Extract & Fill/ }));

  expect(await screen.findByText(/API key not valid/)).toBeInTheDocument();
  expect(onExtracted).not.toHaveBeenCalled();
});

test('rejects more than 3 files or files over 8 MB before calling Gemini', async () => {
  const user = userEvent.setup();
  render(<DocumentUpload onExtracted={() => {}} />);
  await user.type(screen.getByLabelText(/Gemini API key/), 'k');
  await user.upload(screen.getByLabelText(/Ảnh giấy tờ/), [png('1.png'), png('2.png'), png('3.png'), png('4.png')]);
  expect(await screen.findByText(/tối đa 3 ảnh/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Extract & Fill/ })).toBeDisabled();
  expect(extractDocumentData).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/DocumentUpload.test.jsx`
Expected: FAIL – cannot resolve `./DocumentUpload`.

- [ ] **Step 3: Implement `src/components/DocumentUpload.jsx`**

```jsx
import { useState } from 'react';
import { ExtractionError, extractDocumentData, MAX_FILES, MAX_FILE_BYTES } from '../lib/gemini';
import { fileToResizedBase64 } from '../lib/image';

const KEY_STORAGE = 'flysapa_gemini_key';

function loadKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}
function saveKey(value) {
  try {
    localStorage.setItem(KEY_STORAGE, value);
  } catch {
    /* private mode etc. – key just won't persist */
  }
}

function validateFiles(files) {
  if (files.length > MAX_FILES) {
    return `Tối đa ${MAX_FILES} ảnh | Maximum ${MAX_FILES} images`;
  }
  const big = files.find((f) => f.size > MAX_FILE_BYTES);
  if (big) return `Ảnh "${big.name}" vượt quá 8 MB | Image "${big.name}" exceeds 8 MB`;
  return '';
}

export default function DocumentUpload({ onExtracted }) {
  const [apiKey, setApiKey] = useState(loadKey);
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleKeyChange = (e) => {
    setApiKey(e.target.value);
    saveKey(e.target.value);
  };

  const handleFiles = (e) => {
    const list = Array.from(e.target.files ?? []);
    setFiles(list);
    setFileError(validateFiles(list));
    setError('');
  };

  const canExtract = apiKey.trim() !== '' && files.length > 0 && !fileError && !busy;

  const handleExtract = async () => {
    if (!canExtract) return;
    setBusy(true);
    setError('');
    try {
      const images = await Promise.all(files.map((f) => fileToResizedBase64(f)));
      const partial = await extractDocumentData(apiKey.trim(), images);
      onExtracted(partial);
    } catch (err) {
      setError(err instanceof ExtractionError ? err.userMessage : 'Lỗi không xác định | Unexpected error');
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-8">
      <div className={`p-4 border border-indigo-200 bg-indigo-50 rounded-lg ${busy ? 'pulsating-border' : ''}`}>
        <h2 className="text-lg font-semibold text-indigo-800 mb-1">Tự động điền từ ảnh giấy tờ | Auto-fill from ID document</h2>
        <p className="text-sm text-gray-600 mb-4">
          Tải ảnh CCCD (người Việt Nam) hoặc Passport (người nước ngoài) để tự động điền thông tin bên dưới. |
          Upload a clear photo of your Vietnamese ID card (CCCD) or passport to automatically fill in your details below.
        </p>

        <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-700">
          Gemini API key
        </label>
        <input
          id="gemini-key"
          type="password"
          value={apiKey}
          onChange={handleKeyChange}
          autoComplete="off"
          className="mt-1 mb-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mb-4">
          Lấy key miễn phí tại | Get a free key at{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
            aistudio.google.com/apikey
          </a>
          . Key chỉ lưu trên trình duyệt này và chỉ gửi tới Google. | The key is stored only in this browser and sent only to Google.
        </p>

        <label htmlFor="document-upload" className="block text-sm font-medium text-gray-700">
          Ảnh giấy tờ | Document image(s)
        </label>
        <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            id="document-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
          <button
            type="button"
            onClick={handleExtract}
            disabled={!canExtract}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md text-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {busy ? 'Đang trích xuất… | Extracting…' : 'Trích xuất & điền | Extract & Fill'}
          </button>
        </div>
        {files.length > 0 && !fileError && (
          <p className="mt-2 text-xs text-gray-600">{files.map((f) => f.name).join(', ')}</p>
        )}
        {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire into `src/App.jsx`**

Add the import and handler, and render the card above page 1:

```jsx
import DocumentUpload from './components/DocumentUpload';
// ...inside App:
const handleExtracted = (partial) => setFormData((prev) => ({ ...prev, ...partial }));
// ...in JSX, first child of the container:
<DocumentUpload onExtracted={handleExtracted} />
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test`
Expected: all suites pass (filename 4, gemini 13, App 3, DocumentUpload 5).

- [ ] **Step 6: Manual check with a real key**

Run: `npm run dev`. Paste a Gemini key, upload `.docs/CCCD-sample.jpg`, click Extract. Expected fields: ĐÀO MAI THANH / 21/02/1982 / Nữ / Việt Nam / 026182015285 / 18/01/2024 / 21/02/2042 / Triệu Đề, Lập Thạch, Vĩnh Phúc / address Tổ 3 Phúc Đồng, Long Biên, Hà Nội. Repeat with `.docs/passport-sample.jpg`: JAWAD ABDEN-NUR TAHA / 02/03/2002 / M / FILIPINO / P4286420C / 01/06/2023 / 31/05/2033 / ZAMBOANGA CITY. If a field is consistently wrong, adjust `PROMPT` in `src/lib/gemini.js` (not the tests).

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: document upload card with Gemini auto-fill

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: PDF export

**Files:**
- Create: `src/lib/pdf.js`, `src/lib/pdf.test.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildPdfFilename` (Task 2); `page1Ref`, `page2Ref`, `isPdfMode`, `isProcessing` from `App` (Task 4).
- Produces: `exportPdf({ pages: HTMLElement[], fileName: string, deps? }): Promise<void>` where `deps = { html2canvas, jsPDF }` defaults to the real libraries (injectable for tests).

- [ ] **Step 1: Write the failing test**

`src/lib/pdf.test.js`:
```js
import { expect, test, vi } from 'vitest';
import { exportPdf } from './pdf';

function fakeCanvas(width, height) {
  return { width, height, toDataURL: () => `data:image/png;base64,${width}x${height}` };
}

test('renders each page with html2canvas at scale 2 and adds them to an A4 jsPDF', async () => {
  const html2canvas = vi.fn(async () => fakeCanvas(1000, 1414));
  const pdf = {
    internal: { pageSize: { getWidth: () => 446, getHeight: () => 631 } },
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
  };
  const jsPDF = vi.fn(() => pdf);
  const p1 = document.createElement('div');
  const p2 = document.createElement('div');

  await exportPdf({ pages: [p1, p2], fileName: 'x.pdf', deps: { html2canvas, jsPDF } });

  expect(jsPDF).toHaveBeenCalledWith({ orientation: 'p', unit: 'px', format: 'a4', compress: true });
  expect(html2canvas).toHaveBeenCalledTimes(2);
  expect(html2canvas.mock.calls[0][0]).toBe(p1);
  expect(html2canvas.mock.calls[0][1]).toMatchObject({ scale: 2, useCORS: true });
  expect(pdf.addPage).toHaveBeenCalledTimes(1);
  expect(pdf.addImage).toHaveBeenCalledTimes(2);
  // ratio = min(446/1000, 631/1414) = 0.446 -> width 446, height ~630.6, x = 0
  const [, fmt, x, y, w] = pdf.addImage.mock.calls[0];
  expect(fmt).toBe('PNG');
  expect(x).toBeCloseTo(0, 5);
  expect(y).toBe(0);
  expect(w).toBeCloseTo(446, 5);
  expect(pdf.save).toHaveBeenCalledWith('x.pdf');
});

test('temporarily fixes page height to 1056px and restores it afterwards', async () => {
  const seen = [];
  const html2canvas = vi.fn(async (el) => {
    seen.push(el.style.height);
    return fakeCanvas(10, 14);
  });
  const pdf = { internal: { pageSize: { getWidth: () => 10, getHeight: () => 14 } }, addImage: vi.fn(), addPage: vi.fn(), save: vi.fn() };
  const p1 = document.createElement('div');
  await exportPdf({ pages: [p1], fileName: 'y.pdf', deps: { html2canvas, jsPDF: () => pdf } });
  expect(seen).toEqual(['1056px']);
  expect(p1.style.height).toBe('');
});

test('restores height even when rendering throws', async () => {
  const html2canvas = vi.fn(async () => { throw new Error('boom'); });
  const pdf = { internal: { pageSize: { getWidth: () => 10, getHeight: () => 14 } }, addImage: vi.fn(), addPage: vi.fn(), save: vi.fn() };
  const p1 = document.createElement('div');
  await expect(exportPdf({ pages: [p1], fileName: 'z.pdf', deps: { html2canvas, jsPDF: () => pdf } })).rejects.toThrow('boom');
  expect(p1.style.height).toBe('');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/pdf.test.js`
Expected: FAIL – cannot resolve `./pdf`.

- [ ] **Step 3: Implement `src/lib/pdf.js`**

```js
import html2canvasLib from 'html2canvas';
import { jsPDF as jsPDFLib } from 'jspdf';

// A4 at 96 dpi is 794x1123 px; the reference app fixes the on-screen page
// cards to 1056 px so both pages rasterise with identical proportions.
export const PAGE_HEIGHT_PX = 1056;

export async function exportPdf({ pages, fileName, deps = {} }) {
  const html2canvas = deps.html2canvas ?? html2canvasLib;
  const jsPDF = deps.jsPDF ?? jsPDFLib;

  const previousHeights = pages.map((el) => el.style.height);
  pages.forEach((el) => {
    el.style.height = `${PAGE_HEIGHT_PX}px`;
  });

  try {
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
    const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4', compress: true });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i += 1) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollY: typeof window !== 'undefined' ? -window.scrollY : 0,
      });
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      const x = (pdfWidth - w) / 2;
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, 0, w, h);
    }
    pdf.save(fileName);
  } finally {
    pages.forEach((el, i) => {
      el.style.height = previousHeights[i];
    });
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/pdf.test.js`
Expected: 3 passed.

- [ ] **Step 5: Wire the Export button into `src/App.jsx`**

Add imports:
```jsx
import { exportPdf } from './lib/pdf';
import { buildPdfFilename } from './lib/filename';
```

Add handler inside `App`:
```jsx
const handleExportPdf = async () => {
  if (!page1Ref.current || !page2Ref.current || isProcessing) return;
  setIsProcessing(true);
  setIsPdfMode(true);
  // Let React paint the PDF-mode overlays before rasterising.
  await new Promise((resolve) => setTimeout(resolve, 300));
  try {
    await exportPdf({ pages: [page1Ref.current, page2Ref.current], fileName: buildPdfFilename(formData.fullName) });
  } catch (err) {
    console.error(err);
    alert('Có lỗi khi tạo PDF, vui lòng thử lại. | There was an error while creating the PDF. Please try again.');
  } finally {
    setIsPdfMode(false);
    setIsProcessing(false);
  }
};
```

Render the action card between `<WaiverPage …/>` and the "Powered by" footer:
```jsx
<div className="p-6 bg-white shadow-lg rounded-lg">
  <button
    type="button"
    onClick={handleExportPdf}
    disabled={isProcessing}
    className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
  >
    {isProcessing ? 'Đang tạo PDF… | Preparing PDF…' : 'Xuất PDF | Export to PDF'}
  </button>
</div>
```

- [ ] **Step 6: Add an App test for the button** (append to `src/App.test.jsx`)

```jsx
import { vi } from 'vitest';
vi.mock('./lib/pdf', () => ({ exportPdf: vi.fn(async () => {}) }));
import { exportPdf } from './lib/pdf';

test('Export button calls exportPdf with both pages and the dynamic file name', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('Họ và tên | Full name', { selector: '#fullName' }), 'ĐÀO MAI THANH');
  await user.click(screen.getByRole('button', { name: /Export to PDF/ }));
  await waitFor(() => expect(exportPdf).toHaveBeenCalledTimes(1));
  const arg = exportPdf.mock.calls[0][0];
  expect(arg.pages).toHaveLength(2);
  expect(arg.fileName).toMatch(/^\d{8}_ĐÀO_MAI_THANH_FSP_Waiver\.pdf$/);
});
```

(Add `waitFor` to the existing `@testing-library/react` import; keep the `vi.mock` call at module top level, before `import App`.)

- [ ] **Step 7: Run all tests and manual PDF check**

Run: `npm test`
Expected: all pass.
Run: `npm run dev`, fill the form (or extract from `.docs/CCCD-sample.jpg`), click **Xuất PDF | Export to PDF**. Open the downloaded `YYYYMMDD_ĐÀO_MAI_THANH_FSP_Waiver.pdf` next to `.docs/20260920_ĐÀO_MAI_THANH_FSP_Waiver.pdf`: two A4 pages, same header, sections, values inside boxes, waiver text, empty signature boxes and footers.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: export two-page A4 PDF via html2canvas + jsPDF

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: README, GitHub Actions deploy, publish repo

**Files:**
- Create: `README.md`, `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm test`, `npm run build` (Task 1).
- Produces: public repo `flysapa-waiver`, live URL `https://<login>.github.io/flysapa-waiver/`.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create `README.md`**

```markdown
# FlySapa Waiver – Mẫu đăng ký bay | Paragliding Registration Form

Ứng dụng web tĩnh giúp khách bay dù lượn tự điền **Mẫu đăng ký bay** và **Thoả thuận miễn trừ trách nhiệm** của CÔNG TY TNHH DU LỊCH THỂ THAO MÂY (FlySapa) từ ảnh CCCD hoặc Passport, rồi xuất ra PDF 2 trang A4.

A static web app that auto-fills FlySapa's bilingual **Registration Form** and **Waiver Agreement** from a photo of a Vietnamese ID card (CCCD) or a passport, then exports a two-page A4 PDF.

**Live:** https://<login>.github.io/flysapa-waiver/

## Cách dùng | How to use

1. Lấy Gemini API key miễn phí tại https://aistudio.google.com/apikey và dán vào ô **Gemini API key** (key chỉ lưu trong trình duyệt của bạn và chỉ gửi tới Google).
   Get a free Gemini API key at https://aistudio.google.com/apikey and paste it into **Gemini API key** (stored only in your browser, sent only to Google).
2. Chọn ảnh giấy tờ (CCCD – có thể là ảnh chụp màn hình VNeID – hoặc Passport; tối đa 3 ảnh, mỗi ảnh ≤ 8 MB) và bấm **Trích xuất & điền | Extract & Fill**.
   Select your document image(s) and click **Extract & Fill**.
3. Kiểm tra / bổ sung các ô còn trống (địa chỉ, điện thoại, email, người liên hệ khẩn cấp).
   Review and complete the remaining fields.
4. Bấm **Xuất PDF | Export to PDF** → file `YYYYMMDD_HỌ_TÊN_FSP_Waiver.pdf`. In ra và ký tay vào ô *Ký tên / Ngày*.
   Click **Export to PDF**, print and sign by hand.

## Phát triển | Development

```bash
npm install
npm run dev      # http://localhost:5173/flysapa-waiver/
npm test         # vitest
npm run build    # dist/
```

Deploy tự động lên GitHub Pages qua GitHub Actions khi push lên `main`.

## Công nghệ | Tech

Vite · React 19 · Tailwind CSS 3 · Gemini 2.5 Flash (REST, gọi trực tiếp từ trình duyệt) · html2canvas · jsPDF

Không có backend; không dữ liệu nào được lưu trên máy chủ. | No backend; nothing is stored server-side.
```

(Replace `<login>` with the actual GitHub username in Step 5.)

- [ ] **Step 3: Verify build locally**

Run: `npm test` then `npm run build`
Expected: tests pass; `dist/index.html` references `/flysapa-waiver/assets/...`.

- [ ] **Step 4: Commit**

```bash
git add README.md .github
git commit -m "ci: GitHub Pages deploy workflow and README

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Publish (requires the user to have run `gh auth login` for vietthien211@gmail.com)**

```bash
gh auth status                       # confirm the personal account is listed
gh auth switch --user <login>        # the login of the vietthien211@gmail.com account
gh api user --jq .login              # verify
# update README live URL with the real login, then amend into a new commit:
git commit -am "docs: set live URL" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
gh repo create flysapa-waiver --public --source . --remote origin --push
gh api -X POST repos/<login>/flysapa-waiver/pages -f build_type=workflow
gh run watch                         # wait for the deploy workflow
```

Expected: `https://<login>.github.io/flysapa-waiver/` serves the app; upload + extract + export work in the browser.

- [ ] **Step 6: Final verification**

Open the live URL, extract from `.docs/CCCD-sample.jpg`, export the PDF and compare with `.docs/20260920_ĐÀO_MAI_THANH_FSP_Waiver.pdf`. Confirm `.docs/` is **not** in the repo: `gh api repos/<login>/flysapa-waiver/contents --jq '.[].name'` must not list `.docs`.
