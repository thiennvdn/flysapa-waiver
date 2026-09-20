import { forwardRef } from 'react';
import InputField from './InputField';
import SectionTitle from './SectionTitle';
import PageHeader from './PageHeader';
import PageFooter from './PageFooter';

function GenderRadio({ id, value, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer text-sm text-gray-900">
      <input type="radio" id={id} name="gender" value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`w-4 h-4 inline-flex items-center justify-center rounded-full border-2 ${
          checked ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
        }`}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
      </span>
      <span className="ml-2">{label}</span>
    </label>
  );
}

const RegistrationPage = forwardRef(function RegistrationPage({ formData, onChange, onGenderChange, isPdfMode }, ref) {
  const field = (label, name, extra = {}) => (
    <InputField label={label} name={name} value={formData[name]} onChange={onChange} isPdfMode={isPdfMode} {...extra} />
  );
  return (
    <div ref={ref} className="p-8 md:p-12 min-h-[1056px] flex flex-col bg-white shadow-lg rounded-lg">
      <PageHeader />
      <div className="flex-grow">
        <h1 className="text-2xl font-bold text-center my-8 text-gray-800">MẪU ĐĂNG KÝ BAY | Registration Form</h1>

        <SectionTitle title="Thông tin cá nhân | Personal Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {field('Họ và tên | Full name', 'fullName')}
          {field('Nơi sinh | Place of Birth', 'placeOfBirth')}
          <div>
            <span className="block text-sm font-medium text-gray-700">Giới tính | Gender</span>
            <div className="mt-2 flex items-center space-x-6">
              <GenderRadio id="gender-m" value="M" label="Nam | M" checked={formData.gender === 'M'} onChange={onGenderChange} />
              <GenderRadio id="gender-f" value="F" label="Nữ | F" checked={formData.gender === 'F'} onChange={onGenderChange} />
            </div>
          </div>
          {field('Ngày sinh | Date of Birth (DD/MM/YYYY)', 'dateOfBirth')}
          {field('Quốc tịch | Nationality', 'nationality')}
          {field('Số giấy tờ tuỳ thân | Passport Number', 'passportNumber')}
          {field('Ngày cấp | Date of Issuance', 'dateOfIssuance')}
          {field('Ngày hết hạn | Date of Expiry', 'dateOfExpiry')}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {field('Địa chỉ | Vietnamese address', 'vietnameseAddress')}
          {field('Số điện thoại | Phone number', 'phoneNumber', { type: 'tel' })}
          {field('E-mail | Email', 'email', { type: 'email' })}
        </div>

        <SectionTitle title="Người liên hệ trong trường hợp khẩn cấp/ Contact in case of emergency" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {field('Họ và tên | Full name', 'emergencyContactName')}
          {field('Quan hệ | Relationship', 'emergencyContactRelationship')}
          {field('Số điện thoại | Mobile phone', 'emergencyContactPhone', { type: 'tel' })}
          {field('E-mail | Email', 'emergencyContactEmail', { type: 'email' })}
        </div>

        <div className="mt-8 text-sm text-gray-800">
          <p className="font-semibold">
            Tôi cam đoan rằng tất cả thông tin tôi cung cấp trong bản cam kết này là đầy đủ, chính xác và trung thực theo hiểu biết của tôi.
          </p>
          <p className="italic mt-1">
            I warrant that all information provided in this waiver is complete, accurate, and truthful to the best of my knowledge.
          </p>
        </div>
      </div>
      <PageFooter page={1} />
    </div>
  );
});

export default RegistrationPage;
