import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./lib/pdf', () => ({ exportPdf: vi.fn(async () => {}) }));
vi.mock('./lib/gemini', async (importOriginal) => ({ ...(await importOriginal()), extractDocumentData: vi.fn() }));
vi.mock('./lib/image', () => ({ fileToResizedBase64: vi.fn(async () => ({ mimeType: 'image/jpeg', data: 'b64' })) }));

import { exportPdf } from './lib/pdf';
import { extractDocumentData } from './lib/gemini';
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

test('a new extraction clears document fields the new document does not have, keeping typed contact info', async () => {
  vi.stubEnv('VITE_GEMINI_API_KEY', 'k');
  const user = userEvent.setup();
  render(<App />);
  const upload = screen.getByLabelText(/Ảnh giấy tờ/);
  const extract = screen.getByRole('button', { name: /Extract & Fill/ });
  const address = screen.getByLabelText('Địa chỉ | Vietnamese address');
  const fullName = screen.getByLabelText('Họ và tên | Full name', { selector: '#fullName' });
  const phone = screen.getByLabelText('Số điện thoại | Phone number');

  extractDocumentData.mockResolvedValueOnce({ fullName: 'NGUYỄN VĂN A', gender: 'M', vietnameseAddress: 'Sa Pa, Lào Cai' });
  await user.upload(upload, new File(['a'], 'cccd.png', { type: 'image/png' }));
  await user.click(extract);
  await waitFor(() => expect(address).toHaveValue('Sa Pa, Lào Cai'));
  await user.type(phone, '0912345678');

  extractDocumentData.mockResolvedValueOnce({ fullName: 'JOHN SMITH', nationality: 'USA' });
  await user.upload(upload, new File(['b'], 'passport.png', { type: 'image/png' }));
  await user.click(extract);
  await waitFor(() => expect(fullName).toHaveValue('JOHN SMITH'));
  expect(address).toHaveValue('');
  expect(screen.getByLabelText('Nam | M')).not.toBeChecked();
  expect(phone).toHaveValue('0912345678');
  vi.unstubAllEnvs();
});
