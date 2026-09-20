import { useRef, useState } from 'react';
import { EMPTY_FORM } from './formData';
import DocumentUpload from './components/DocumentUpload';
import RegistrationPage from './components/RegistrationPage';
import WaiverPage from './components/WaiverPage';

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

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="container max-w-4xl mx-auto space-y-8">
        <DocumentUpload onExtracted={handleExtracted} />
        <RegistrationPage ref={page1Ref} formData={formData} onChange={handleChange} onGenderChange={handleGenderChange} isPdfMode={isPdfMode} />
        <WaiverPage ref={page2Ref} formData={formData} onChange={handleChange} isPdfMode={isPdfMode} />
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
