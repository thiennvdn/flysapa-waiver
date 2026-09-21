import { useRef, useState } from 'react';
import { EMPTY_FORM } from './formData';
import { exportPdf } from './lib/pdf';
import { buildPdfFilename } from './lib/filename';
import ApiKeySettings from './components/ApiKeySettings';
import DocumentUpload from './components/DocumentUpload';
import RegistrationPage from './components/RegistrationPage';
import WaiverPage from './components/WaiverPage';
import { hasStaffAccess } from './lib/apiKeyStorage';

export default function App() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleGenderChange = (e) => setFormData((prev) => ({ ...prev, gender: e.target.value }));
  // `partial` already excludes empty fields, so user-typed values survive.
  const handleExtracted = (partial) => setFormData((prev) => ({ ...prev, ...partial }));

  const handleExportPdf = async () => {
    if (!page1Ref.current || !page2Ref.current || isProcessing) return;
    setIsProcessing(true);
    setIsPdfMode(true);
    // Let React paint the PDF-mode overlays before rasterising.
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      await exportPdf({ pages: [page1Ref.current, page2Ref.current], fileName: buildPdfFilename(formData.fullName) });
    } catch (err) {
      console.error(err);
      alert(`Có lỗi khi tạo PDF, vui lòng thử lại. | There was an error while creating the PDF. Please try again.

${err?.message ?? err}`);
    } finally {
      setIsPdfMode(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      {hasStaffAccess() && <ApiKeySettings />}
      <div className="container max-w-4xl mx-auto space-y-8">
        <DocumentUpload onExtracted={handleExtracted} />
        <RegistrationPage ref={page1Ref} formData={formData} onChange={handleChange} onGenderChange={handleGenderChange} isPdfMode={isPdfMode} />
        <WaiverPage ref={page2Ref} formData={formData} onChange={handleChange} isPdfMode={isPdfMode} />
        <div className="p-6 bg-white shadow-lg rounded-lg">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isProcessing}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Đang tạo PDF… | Preparing PDF…' : 'Xuất PDF | Export to PDF'}
          </button>
        </div>
        <div className="text-center pb-4">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <a href="https://flysapa.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">
              FlySapa
            </a>{' '}
            AI
          </p>
        </div>
      </div>
    </div>
  );
}
