// Lets FlySapa staff swap in a fresh Gemini API key from the browser, on the
// handful of devices used at the counter, without going through GitHub
// secrets + a rebuild. Stored per-device in localStorage; regular visitors
// never see this and keep using the build-time key baked into the bundle.
const STORAGE_KEY = 'flysapa_gemini_api_key_override';

export function getStoredApiKey() {
  try {
    return (localStorage.getItem(STORAGE_KEY) ?? '').trim();
  } catch {
    return '';
  }
}

export function setStoredApiKey(key) {
  try {
    const trimmed = (key ?? '').trim();
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage unavailable (private mode, etc.) — silently no-op */
  }
}

// Reveals the key-swap panel only when the URL is opened with ?staff — never
// discoverable from the normal registration flow.
export function hasStaffAccess() {
  try {
    return new URLSearchParams(window.location.search).has('staff');
  } catch {
    return false;
  }
}
