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
