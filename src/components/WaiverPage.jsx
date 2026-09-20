import { forwardRef } from 'react';
import InputField from './InputField';
import WaiverText from './WaiverText';
import PageFooter from './PageFooter';

const PARAGRAPHS = [
  {
    vietnamese: 'Tôi tự nguyện tham gia môn chơi dù lượn và tự chịu trách nhiệm cho mọi rủi ro có thể xảy ra với bản thân.',
    english: 'I voluntarily participate in paragliding and assume full responsibility for any risks that may arise to myself.',
  },
  {
    vietnamese:
      'Tôi nhận thức và chấp nhận rằng môn dù lượn là môn thể thao mạo hiểm. Tôi hiểu rằng Công ty không chịu trách nhiệm cho sự an toàn của tôi trong quá trình chuẩn bị, tham gia các hoạt động dù lượn liên quan. Tôi từ bỏ quyền pháp lý và đồng ý miễn trừ trách nhiệm đối với CÔNG TY TNHH DU LỊCH THỂ THAO MÂY, phi công, đại lý, nhân viên hỗ trợ, và các đối tác khác trong trường hợp xảy ra các rủi ro như: tai nạn, chấn thương, thương vong, mất mát, hư hỏng tài sản, tử vong.',
    english:
      'I acknowledge and accept that paragliding is a high-risk sport. I understand that the Company does not assume any responsibility for my safety during the preparation for, participation in any related paragliding activities. I waive any legal rights and agree to hold the Company, its pilots, agents, support staff, and other partners harmless in the event of any risks such as: Accidents, injuries, and fatalities, Loss or damage to property.',
  },
  {
    vietnamese: 'Tôi tự nguyện ký tên và đồng ý với tất cả các điều khoản và điều kiện của Công ty công bố trên website flysapa.com.',
    english: 'I voluntarily sign and agree to all the terms and conditions of the Company as published on the website flysapa.com.',
  },
  {
    vietnamese:
      'Việc ký tên vào bản cam kết này được thực hiện một cách tự nguyện, không bị ép buộc, và với sự hiểu biết đầy đủ về tầm quan trọng của nó. Khi ký vào bản cam kết này, tôi hoàn toàn minh mẫn và tỉnh táo.',
    english:
      'The signing of this waiver is done voluntarily, without coercion, and with a full understanding of its importance. At the time of signing this waiver, I am fully alert and of sound mind.',
  },
];

const WaiverPage = forwardRef(function WaiverPage({ formData, onChange, isPdfMode }, ref) {
  return (
    <div ref={ref} className="p-8 md:p-12 min-h-[1056px] flex flex-col bg-white shadow-lg rounded-lg">
      <div className="flex-grow">
        <h1 className="text-2xl font-bold text-center my-8 text-gray-800">THOẢ THUẬN MIỄN TRỪ TRÁCH NHIỆM | Waiver Agreement</h1>
        {PARAGRAPHS.map((p) => (
          <WaiverText key={p.english} vietnamese={p.vietnamese} english={p.english} />
        ))}
        <p className="text-sm italic mt-4 text-gray-700">
          If you encounter any misunderstandings or unclear meanings in English, please note that Vietnamese is the primary language used in this registration and disclaimer.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField label="Ký tên | Signature" name="signature" value={formData.signature} onChange={onChange} readOnly inputClassName="h-20" isPdfMode={isPdfMode} />
          <InputField label="Ngày | Date" name="signatureDate" value={formData.signatureDate} onChange={onChange} readOnly inputClassName="h-20" isPdfMode={isPdfMode} />
        </div>
      </div>
      <PageFooter page={2} />
    </div>
  );
});

export default WaiverPage;
