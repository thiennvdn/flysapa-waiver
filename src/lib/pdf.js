// html2canvas-pro: maintained fork that understands modern color functions
// (oklch/oklab/lab/lch/color()). Browser extensions and newer UA styles can
// inject those into computed styles; the original html2canvas throws on them.
import html2canvasLib from 'html2canvas-pro';
import { jsPDF as jsPDFLib } from 'jspdf';

// A4 is 210 x 297 mm. Each page card is stretched to that ratio while it is
// rasterised so the image fills the PDF page and the footer sits at the
// bottom; content taller than that simply grows the page (it is then scaled
// to fit) instead of being overlapped by the footer.
export const A4_RATIO = 297 / 210;

export async function exportPdf({ pages, fileName, deps = {} }) {
  const html2canvas = deps.html2canvas ?? html2canvasLib;
  const jsPDF = deps.jsPDF ?? jsPDFLib;

  const previous = pages.map((el) => ({ height: el.style.height, minHeight: el.style.minHeight }));
  pages.forEach((el) => {
    el.style.height = '';
    el.style.minHeight = `${Math.round(el.offsetWidth * A4_RATIO)}px`;
  });

  try {
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
    const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4', compress: true });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i += 1) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollY: typeof window !== 'undefined' ? -window.scrollY : 0,
      });
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      const x = (pdfWidth - w) / 2;
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, 0, w, h);
    }
    pdf.save(fileName);
  } finally {
    pages.forEach((el, i) => {
      el.style.height = previous[i].height;
      el.style.minHeight = previous[i].minHeight;
    });
  }
}
