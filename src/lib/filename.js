// Builds the PDF file name used by the reference app:
// YYYYMMDD_HO_TEN_FSP_Waiver.pdf (diacritics kept, whitespace -> "_").
export function buildPdfFilename(fullName, date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const name = (fullName || '').trim().replace(/\s+/g, '_') || 'NoName';
  return `${yyyy}${mm}${dd}_${name}_FSP_Waiver.pdf`;
}
