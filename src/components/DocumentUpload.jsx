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
