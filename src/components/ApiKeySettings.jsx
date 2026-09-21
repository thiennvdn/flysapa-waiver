import { useState } from 'react';
import { getStoredApiKey, setStoredApiKey } from '../lib/apiKeyStorage';

// Only rendered when the page is opened with ?staff — see hasStaffAccess().
export default function ApiKeySettings() {
  const [value, setValue] = useState(getStoredApiKey());
  const [saved, setSaved] = useState(false);

  const save = () => {
    setStoredApiKey(value);
    setSaved(true);
    // DocumentUpload reads the key once per mount, so reload to pick it up.
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="fixed bottom-3 right-3 z-50 w-72 rounded-lg border border-gray-300 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-700">Gemini API key (staff only)</p>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Dán API key mới… | Paste a new API key…"
        className="mb-2 w-full rounded border border-gray-300 px-2 py-1"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          className="rounded bg-indigo-600 px-2 py-1 font-semibold text-white hover:bg-indigo-700"
        >
          Lưu trên máy này | Save on this device
        </button>
        {saved && <span className="text-green-600">Đã lưu, đang tải lại… | Saved, reloading…</span>}
      </div>
      <p className="mt-2 text-gray-500">
        Chỉ áp dụng cho thiết bị này. Để trống rồi lưu để xoá và dùng lại key mặc định. | Only affects this device.
        Leave blank and save to clear and fall back to the default key.
      </p>
    </div>
  );
}
