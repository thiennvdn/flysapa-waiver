import { afterEach, describe, expect, test } from 'vitest';
import { getStoredApiKey, hasStaffAccess, setStoredApiKey } from './apiKeyStorage';

afterEach(() => {
  localStorage.clear();
});

describe('getStoredApiKey / setStoredApiKey', () => {
  test('round-trips a trimmed key', () => {
    setStoredApiKey('  my-key  ');
    expect(getStoredApiKey()).toBe('my-key');
  });

  test('returns empty string when nothing is stored', () => {
    expect(getStoredApiKey()).toBe('');
  });

  test('clears the stored key when saved blank', () => {
    setStoredApiKey('my-key');
    setStoredApiKey('   ');
    expect(getStoredApiKey()).toBe('');
  });
});

describe('hasStaffAccess', () => {
  test('true only when ?staff is present in the URL', () => {
    window.history.pushState({}, '', '/?staff');
    expect(hasStaffAccess()).toBe(true);

    window.history.pushState({}, '', '/');
    expect(hasStaffAccess()).toBe(false);
  });
});
