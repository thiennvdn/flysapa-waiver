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
import { setStoredApiKey } from '../lib/apiKeyStorage';
import DocumentUpload from './DocumentUpload';

const png = (name, size = 10) => new File([new Uint8Array(size)], name, { type: 'image/png' });

beforeEach(() => {
  vi.stubEnv('VITE_GEMINI_API_KEY', 'build-time-key');
  extractDocumentData.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  localStorage.clear();
});

test('does not render an API key input', () => {
  render(<DocumentUpload onExtracted={() => {}} />);
  expect(screen.queryByLabelText(/Gemini API key/)).not.toBeInTheDocument();
});

test('extract button is disabled until a file is selected', async () => {
  const user = userEvent.setup();
  render(<DocumentUpload onExtracted={() => {}} />);
  const button = screen.getByRole('button', { name: /Extract & Fill/ });
  expect(button).toBeDisabled();

  await user.upload(screen.getByLabelText(/Ảnh giấy tờ/), png('cccd.png'));
  expect(button).toBeEnabled();
});

test('sends resized images with the build-time key and calls onExtracted', async () => {
  const user = userEvent.setup();
  const onExtracted = vi.fn();
  extractDocumentData.mockResolvedValue({ fullName: 'ĐÀO MAI THANH' });
  render(<DocumentUpload onExtracted={onExtracted} />);
  await user.upload(screen.getByLabelText(/Ảnh giấy tờ/), [png('front.png'), png('back.png')]);
  await user.click(screen.getByRole('button', { name: /Extract & Fill/ }));

  await waitFor(() => expect(onExtracted).toHaveBeenCalledWith({ fullName: 'ĐÀO MAI THANH' }));
  expect(extractDocumentData).toHaveBeenCalledWith('build-time-key', [
    { mimeType: 'image/jpeg', data: 'b64-front.png' },
    { mimeType: 'image/jpeg', data: 'b64-back.png' },
  ]);
});

test('prefers a staff-stored key (from the ?staff panel) over the build-time key', async () => {
  setStoredApiKey('device-key');
  const user = userEvent.setup();
  extractDocumentData.mockResolvedValue({});
  render(<DocumentUpload onExtracted={() => {}} />);
  await user.upload(screen.getByLabelText(/Ảnh giấy tờ/), png('x.png'));
  await user.click(screen.getByRole('button', { name: /Extract & Fill/ }));

  await waitFor(() => expect(extractDocumentData).toHaveBeenCalledWith('device-key', expect.anything()));
});

test('shows a configuration error and disables extraction when no key was built in', async () => {
  vi.stubEnv('VITE_GEMINI_API_KEY', '');
  const user = userEvent.setup();
  render(<DocumentUpload onExtracted={() => {}} />);
  expect(screen.getByText(/chưa được cấu hình/i)).toBeInTheDocument();
  await user.upload(screen.getByLabelText(/Ảnh giấy tờ/), png('cccd.png'));
  expect(screen.getByRole('button', { name: /Extract & Fill/ })).toBeDisabled();
  expect(extractDocumentData).not.toHaveBeenCalled();
});

test('shows the ExtractionError message and keeps the form untouched', async () => {
  const user = userEvent.setup();
  const onExtracted = vi.fn();
  extractDocumentData.mockRejectedValue(new ExtractionError('Gemini lỗi | Gemini error (400): API key not valid'));
  render(<DocumentUpload onExtracted={onExtracted} />);
  await user.upload(screen.getByLabelText(/Ảnh giấy tờ/), png('x.png'));
  await user.click(screen.getByRole('button', { name: /Extract & Fill/ }));

  expect(await screen.findByText(/API key not valid/)).toBeInTheDocument();
  expect(onExtracted).not.toHaveBeenCalled();
});

test('rejects more than 3 files before calling Gemini', async () => {
  const user = userEvent.setup();
  render(<DocumentUpload onExtracted={() => {}} />);
  await user.upload(screen.getByLabelText(/Ảnh giấy tờ/), [png('1.png'), png('2.png'), png('3.png'), png('4.png')]);
  expect(await screen.findByText(/tối đa 3 ảnh/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Extract & Fill/ })).toBeDisabled();
  expect(extractDocumentData).not.toHaveBeenCalled();
});
