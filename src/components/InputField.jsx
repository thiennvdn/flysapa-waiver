// In PDF mode the real <input> text is made transparent and an overlay div
// shows the value: html2canvas renders plain divs far more faithfully than
// form controls.
export default function InputField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  readOnly = false,
  inputClassName = '',
  isPdfMode = false,
}) {
  const base =
    'block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 read-only:bg-gray-100 read-only:cursor-not-allowed';
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`${base} ${inputClassName}`}
          style={isPdfMode ? { color: 'transparent', caretColor: 'transparent' } : undefined}
        />
        {isPdfMode && value && (
          <div
            className={`absolute inset-0 flex items-center px-3 py-2 bg-white border border-gray-300 sm:text-sm text-gray-900 pointer-events-none rounded-md ${inputClassName}`}
          >
            {value}
          </div>
        )}
      </div>
    </div>
  );
}
