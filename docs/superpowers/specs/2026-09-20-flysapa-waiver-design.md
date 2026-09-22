# FlySapa Waiver – Design Spec

**Date:** 2026-09-20
**Status:** Approved (design reviewed in chat)

## 1. Goal

A static web app, hosted on GitHub Pages, that reproduces the content and
behaviour of the reference app
(<https://paragliding-registration-form-851612713619.us-west1.run.app/>):

1. The user uploads an image of their identity document – Vietnamese CCCD
   (Căn cước công dân) for Vietnamese citizens, or a passport for foreigners.
2. The app extracts the personal information with Gemini and auto-fills a
   bilingual (Vietnamese | English) two-page form: *Mẫu đăng ký bay |
   Registration Form* and *Thoả thuận miễn trừ trách nhiệm | Waiver Agreement*.
3. The user reviews/edits the fields, then clicks **Export to PDF** and gets a
   two-page A4 PDF identical in layout to `.docs/20260920_ĐÀO_MAI_THANH_FSP_Waiver.pdf`,
   named `YYYYMMDD_HỌ_TÊN_FSP_Waiver.pdf`.

Out of scope (decided with the user): the reference app's "Submit
Registration" button and its Cloud Function backend. There is no backend.

## 2. Decisions

| Topic | Decision |
|---|---|
| Stack | Vite + React 19 + Tailwind CSS (built, not CDN). `jspdf` + `html2canvas-pro` (fork of html2canvas that parses oklch/lab/color() — browser extensions inject those and 1.4.1 throws) from npm. |
| Hosting | Public GitHub repo `flysapa-waiver` under the user's personal account (vietthien211@gmail.com). GitHub Actions builds and deploys to GitHub Pages on push to `main`. |
| Document extraction | Gemini `gemini-3.6-flash` via REST (`generativelanguage.googleapis.com/v1beta`), called directly from the browser. No SDK. |
| API key | **Changed 2026-09-20 (user decision):** injected at build time from the repo secret `GEMINI_API_KEY` → `VITE_GEMINI_API_KEY`; end users never enter a key. Not in source, but present in the built bundle — the key must be referrer-restricted to `https://thiennvdn.github.io/*` in Google Cloud Console. |
| Upload UX | One file input, accepts multiple images (e.g. CCCD front + back). Gemini auto-detects document type. |
| UI language | Bilingual Vietnamese \| English everywhere, matching the reference form labels and PDF. |
| Submit button | Removed. |

## 3. Project structure

```
flysapa-waiver/
├── .github/workflows/deploy.yml   # build + deploy to GitHub Pages on push to main
├── index.html                     # <div id="root">, Inter font, title
├── package.json
├── vite.config.js                 # base: '/flysapa-waiver/'
├── tailwind.config.js, postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx                    # form state, page layout, action bar
│   ├── index.css                  # @tailwind directives + pulse-border keyframes
│   ├── components/
│   │   ├── DocumentUpload.jsx     # API key input, file input, Extract button, errors
│   │   ├── InputField.jsx         # label + input, PDF-mode overlay (as reference)
│   │   ├── SectionTitle.jsx
│   │   ├── WaiverText.jsx         # VI bold + EN italic paragraph pair
│   │   ├── PageHeader.jsx         # company / national motto header
│   │   ├── PageFooter.jsx         # "N | Page CÔNG TY TNHH DU LỊCH THỂ THAO MÂY - MẪU ĐĂNG KÝ / MIỄN TRỪ"
│   │   ├── RegistrationPage.jsx   # page 1
│   │   └── WaiverPage.jsx         # page 2
│   └── lib/
│       ├── gemini.js              # extractDocumentData(apiKey, files) -> partial formData
│       ├── image.js               # fileToResizedBase64(file, maxPx) -> {mimeType, data}
│       ├── pdf.js                 # exportPdf({page1, page2, fileName})
│       └── filename.js            # buildPdfFilename(fullName, date)
├── docs/superpowers/specs/        # this file
└── README.md                      # usage, getting a Gemini key, local dev
```

## 4. Form data model

`formData` in `App` (same 17 keys as the reference):

```
fullName, dateOfBirth, placeOfBirth, gender ('M' | 'F' | ''), nationality,
passportNumber, dateOfIssuance, dateOfExpiry, vietnameseAddress, phoneNumber,
email, emergencyContactName, emergencyContactRelationship,
emergencyContactPhone, emergencyContactEmail, signature, signatureDate
```

All inputs are controlled; the user can edit anything after auto-fill.
`signature` and `signatureDate` are read-only, tall (`h-20`) boxes left blank
for hand-signing after printing, exactly as in the sample PDF.

## 5. Page content (must match reference / sample PDF)

**Page 1 – Registration**
- Header: left "CÔNG TY TNHH DU LỊCH / THỂ THAO MÂY"; right "CỘNG HOÀ XÃ HỘI
  CHỦ NGHĨA VIỆT NAM / Độc lập – Tự do – Hạnh Phúc" (underlined).
- Title: "MẪU ĐĂNG KÝ BAY | Registration Form".
- Section "Thông tin cá nhân | Personal Information", 2-column grid:
  Họ và tên | Full name; Nơi sinh | Place of Birth; Giới tính | Gender
  (radio Nam | M / Nữ | F); Ngày sinh | Date of Birth (DD/MM/YYYY);
  Quốc tịch | Nationality; Số giấy tờ tuỳ thân | Passport Number;
  Ngày cấp | Date of Issuance; Ngày hết hạn | Date of Expiry;
  Địa chỉ | Vietnamese address; Số điện thoại | Phone number; E-mail | Email.
- Section "Người liên hệ trong trường hợp khẩn cấp/ Contact in case of
  emergency": Họ và tên | Full name; Quan hệ | Relationship;
  Số điện thoại | Mobile phone; E-mail | Email.
- Declaration paragraph (VI bold, EN italic): "Tôi cam đoan rằng tất cả thông
  tin…" / "I warrant that all information provided in this waiver…".
- Footer "1 | Page CÔNG TY TNHH DU LỊCH THỂ THAO MÂY - MẪU ĐĂNG KÝ / MIỄN TRỪ".

**Page 2 – Waiver**
- Title "THOẢ THUẬN MIỄN TRỪ TRÁCH NHIỆM | Waiver Agreement".
- Four VI/EN paragraph pairs and the closing English note, verbatim from the
  reference app source (copied into `WaiverPage.jsx`).
- "Ký tên | Signature" and "Ngày | Date" boxes.
- Footer "2 | Page …".

Each page is rendered as an A4-proportioned white card (`min-h-[1056px]`,
`p-8 md:p-12`, flex column, footer pushed to bottom with `mt-auto`).

## 6. Document extraction (`lib/gemini.js`)

**Input:** `apiKey: string`, `files: File[]` (1–3 images, each ≤ 8 MB).
**Output:** `Promise<Partial<FormData>>` with only non-empty fields.

Steps:
1. `image.js` resizes each file on a canvas to max 1600 px on the long edge
   and returns JPEG base64 (reduces tokens/latency; VNeID screenshots and
   phone photos are typically 3–4k px).
2. POST `…/models/gemini-3.6-flash:generateContent?key=<apiKey>` with
   `contents: [{ parts: [ ...inlineData images, { text: PROMPT } ] }]` and
   `generationConfig: { responseMimeType: 'application/json', responseSchema }`.
3. `responseSchema` (OBJECT): `documentType` (STRING enum `CCCD` | `PASSPORT`
   | `UNKNOWN`), `fullName`, `dateOfBirth`, `placeOfBirth`, `gender`,
   `nationality`, `passportNumber`, `dateOfIssuance`, `dateOfExpiry`,
   `address` – all STRING.
4. Parse `candidates[0].content.parts[0].text` as JSON, then normalise:
   - dates → `DD/MM/YYYY` (accept `DD MMM YYYY`, `YYYY-MM-DD`, `DD/MM/YYYY`);
     gender → `M`/`F`; trim strings.
   - `documentType === 'CCCD'` → force `nationality = 'Việt Nam'`;
     `vietnameseAddress = address`.
   - `documentType === 'PASSPORT'` → `vietnameseAddress` left untouched.
   - `UNKNOWN` → throw a user-facing error ("Không nhận diện được giấy tờ").
5. Return the partial; `App` merges it over the current `formData`, skipping
   empty values so existing user input is not wiped.

**Prompt (essence):** "The images show a Vietnamese Citizen Identity Card
(Căn cước công dân, possibly a screenshot from the VNeID app where 'Ngày cấp'
appears as a text row below the card) or a passport. Identify the document
type and extract… For CCCD: `fullName` = Họ và tên (keep uppercase and
diacritics), `passportNumber` = Số/No., `placeOfBirth` = Quê quán / Place of
origin, `address` = Nơi thường trú / Place of residence, `dateOfExpiry` = Có
giá trị đến / Date of expiry, `dateOfIssuance` = Ngày cấp if visible
(front, back, or VNeID row), `nationality` = 'Việt Nam'. For passports:
`fullName` = surname + given names + middle name as printed (uppercase),
`passportNumber` = passport number, `placeOfBirth`, `nationality` as printed,
`address` empty; cross-check with the MRZ. Dates as DD/MM/YYYY. Gender 'M'
or 'F'. Leave unknown fields as empty strings."

**Verification targets** (manual test with real key):

| Sample | Expected |
|---|---|
| `.docs/CCCD-sample.jpg` (VNeID screenshot) | documentType CCCD; ĐÀO MAI THANH; 21/02/1982; F; Việt Nam; 026182015285; issued 18/01/2024; expiry 21/02/2042; placeOfBirth "Triệu Đề, Lập Thạch, Vĩnh Phúc"; address "Tổ 3 Phúc Đồng, Long Biên, Hà Nội" |
| `.docs/passport-sample.jpg` (Philippine passport) | documentType PASSPORT; JAWAD ABDEN-NUR TAHA; 02/03/2002; M; Filipino; P4286420C; issued 01/06/2023; expiry 31/05/2033; placeOfBirth ZAMBOANGA CITY; address empty |

The CCCD row matches the sample PDF `.docs/20260920_ĐÀO_MAI_THANH_FSP_Waiver.pdf`
(which left address blank; we fill it, the user may clear it).

## 7. API key handling (`DocumentUpload.jsx`)

- `import.meta.env.VITE_GEMINI_API_KEY` is read at render; no key input in the UI.
- GitHub Actions passes `secrets.GEMINI_API_KEY` as `VITE_GEMINI_API_KEY` to
  `npm run build`; local dev uses `.env.local` (gitignored).
- If the key is empty (unconfigured build) a red bilingual notice is shown and
  the Extract button stays disabled.

## 8. PDF export (`lib/pdf.js`)

Same mechanism as the reference, kept because it reproduces the sample PDF:

1. `App` sets `isPdfMode = true`; `InputField` makes the real `<input>` text
   transparent and draws an absolutely-positioned overlay `<div>` with the
   value (html2canvas renders divs more faithfully than inputs).
2. Both page elements get `min-height = offsetWidth × 297/210` (A4 ratio,
   ≈1267 px at the 896 px card width) so the raster fills the PDF page and the
   footer sits at the bottom, exactly like the sample PDF; wait ~300 ms;
   `window.scrollTo(0, 0)`. (The reference app's fixed `height: 1056px` made
   the footer overlap the declaration paragraph, so it is not reused.)
3. `html2canvas(el, { scale: 2, useCORS: true, scrollY: -window.scrollY })`
   per page → PNG → `jsPDF({ orientation: 'p', unit: 'px', format: 'a4',
   compress: true })`, image scaled by `min(pdfW/imgW, pdfH/imgH)`, centred
   horizontally, page 2 via `addPage()`.
4. `pdf.save(fileName)`; `finally` restores heights and `isPdfMode = false`.

`filename.js`: `buildPdfFilename(fullName, date = new Date())` →
`${yyyy}${mm}${dd}_${name}_FSP_Waiver.pdf` where `name` = trimmed full name
with whitespace runs replaced by `_` (diacritics kept), or `NoName`.

## 9. Layout of the app page

Top to bottom, in a `max-w-4xl` container on a `bg-gray-200` body:

1. Card: **Tự động điền từ ảnh giấy tờ | Auto-fill from ID document** –
   API key input, file input (`accept="image/*" multiple`), thumbnails of
   selected files, button "Trích xuất & điền | Extract & Fill" (shows
   "Đang trích xuất… | Extracting…" and a pulsing border while busy), error
   text in red.
2. Page 1 card, Page 2 card.
3. Action card with one full-width green button "Xuất PDF | Export to PDF"
   ("Đang tạo PDF… | Preparing PDF…" while busy).
4. Footer "Powered by FlySapa AI".

Styling follows the reference Tailwind classes (indigo accents for upload
card, gray-800 text, `shadow-lg rounded-lg` cards).

## 10. Error handling

| Situation | Behaviour |
|---|---|
| Extract clicked without key | Red hint under key input, no request. |
| File > 8 MB or > 3 files | Red hint, request not sent. |
| Gemini HTTP error (400 bad key, 429 quota, 5xx) | Red message with status and Google's error message; form untouched. |
| Gemini returns `UNKNOWN` / unparsable JSON | "Không nhận diện được giấy tờ, vui lòng thử ảnh rõ hơn \| Could not read the document, please try a clearer photo." |
| PDF generation throws | `alert` bilingual error; state reset in `finally`. |

## 11. Testing

- **Vitest + jsdom**:
  - `filename.test.js`: date formatting, whitespace → `_`, diacritics kept, empty → `NoName`.
  - `gemini.test.js`: with mocked `fetch`, verifies request shape (model URL,
    schema, image parts), CCCD normalisation (nationality forced, address
    mapped), PASSPORT normalisation (`DD MMM YYYY` → `DD/MM/YYYY`),
    empty-field skipping, error mapping for non-2xx and `UNKNOWN`.
  - `App.test.jsx`: renders all bilingual labels; typing updates fields;
    gender radio toggles.
- **Manual**: `npm run dev`, paste a key, upload each sample in `.docs/`,
  verify fields match §6, export PDF and compare visually with
  `.docs/20260920_ĐÀO_MAI_THANH_FSP_Waiver.pdf`.

## 12. Deployment

1. `git init`, local `user.email = vietthien211@gmail.com`. `.gitignore`
   excludes `.docs/` (contains real personal ID samples – never publish),
   `.claude/`, `.graphify*`, `node_modules/`, `dist/`.
2. After the user runs `gh auth login` for the personal account:
   `gh auth switch --user <login>`, `gh repo create flysapa-waiver --public
   --source . --push`.
3. `.github/workflows/deploy.yml`: on push to `main` → `npm ci`, `npm test`,
   `npm run build`, `actions/upload-pages-artifact` (`dist/`),
   `actions/deploy-pages`. Repo Pages source set to "GitHub Actions" via
   `gh api`.
4. Public URL: `https://<login>.github.io/flysapa-waiver/`.
