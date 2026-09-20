export default function PageHeader() {
  return (
    <div className="grid grid-cols-2 items-start text-sm font-semibold text-gray-800 gap-x-8">
      <div className="text-center">
        <p>CÔNG TY TNHH DU LỊCH</p>
        <p>THỂ THAO MÂY</p>
      </div>
      <div className="text-center">
        <p>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="border-b-2 border-black inline-block px-4 pb-1">Độc lập – Tự do – Hạnh Phúc</p>
      </div>
    </div>
  );
}
