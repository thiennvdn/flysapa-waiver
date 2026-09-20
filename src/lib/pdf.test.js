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
  const jsPDF = vi.fn(function () { return pdf; });
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

test('forces each page to A4 proportions (min-height = width * 297/210) while rendering and restores styles afterwards', async () => {
  const seen = [];
  const html2canvas = vi.fn(async (el) => {
    seen.push({ height: el.style.height, minHeight: el.style.minHeight });
    return fakeCanvas(10, 14);
  });
  const pdf = { internal: { pageSize: { getWidth: () => 10, getHeight: () => 14 } }, addImage: vi.fn(), addPage: vi.fn(), save: vi.fn() };
  const p1 = document.createElement('div');
  Object.defineProperty(p1, 'offsetWidth', { value: 896 });
  p1.style.minHeight = '1056px';
  p1.style.height = '50px';
  await exportPdf({ pages: [p1], fileName: 'y.pdf', deps: { html2canvas, jsPDF: function () { return pdf; } } });
  // 896 * 297 / 210 = 1267.2 -> 1267
  expect(seen).toEqual([{ height: '', minHeight: '1267px' }]);
  expect(p1.style.minHeight).toBe('1056px');
  expect(p1.style.height).toBe('50px');
});

test('restores styles even when rendering throws', async () => {
  const html2canvas = vi.fn(async () => {
    throw new Error('boom');
  });
  const pdf = { internal: { pageSize: { getWidth: () => 10, getHeight: () => 14 } }, addImage: vi.fn(), addPage: vi.fn(), save: vi.fn() };
  const p1 = document.createElement('div');
  Object.defineProperty(p1, 'offsetWidth', { value: 896 });
  await expect(exportPdf({ pages: [p1], fileName: 'z.pdf', deps: { html2canvas, jsPDF: function () { return pdf; } } })).rejects.toThrow('boom');
  expect(p1.style.minHeight).toBe('');
  expect(p1.style.height).toBe('');
});
