# FlySapa Waiver – Mẫu đăng ký bay | Paragliding Registration Form

Ứng dụng web tĩnh giúp khách bay dù lượn tự điền **Mẫu đăng ký bay** và **Thoả thuận miễn trừ trách nhiệm** của CÔNG TY TNHH DU LỊCH THỂ THAO MÂY (FlySapa) từ ảnh CCCD hoặc Passport, rồi xuất ra PDF 2 trang A4.

A static web app that auto-fills FlySapa's bilingual **Registration Form** and **Waiver Agreement** from a photo of a Vietnamese ID card (CCCD) or a passport, then exports a two-page A4 PDF.

**Live:** https://thiennvdn.github.io/flysapa-waiver/

## Cách dùng | How to use

1. Chọn ảnh giấy tờ (CCCD – có thể là ảnh chụp màn hình VNeID – hoặc Passport; tối đa 3 ảnh, mỗi ảnh ≤ 8 MB) và bấm **Trích xuất & điền | Extract & Fill**.
   Select your document image(s) and click **Extract & Fill**.
2. Kiểm tra / bổ sung các ô còn trống (địa chỉ, điện thoại, email, người liên hệ khẩn cấp).
   Review and complete the remaining fields.
3. Bấm **Xuất PDF | Export to PDF** → file `YYYYMMDD_HỌ_TÊN_FSP_Waiver.pdf`. In ra và ký tay vào ô *Ký tên / Ngày*.
   Click **Export to PDF**, print and sign by hand.

## Phát triển | Development

```bash
npm install
npm run dev      # http://localhost:5173/flysapa-waiver/
npm test         # vitest
npm run build    # dist/
```

Ứng dụng cần Gemini API key lúc build (biến `VITE_GEMINI_API_KEY`):

- **Local:** tạo file `.env.local` (đã gitignore) với nội dung `VITE_GEMINI_API_KEY=<key>`.
- **GitHub Pages:** key nằm trong repo secret `GEMINI_API_KEY` (`gh secret set GEMINI_API_KEY`); workflow inject vào bước build. Deploy tự động khi push lên `main`.

Vì đây là app tĩnh, key sẽ có trong bundle JS của trang. Hãy giới hạn key trong Google Cloud Console: *HTTP referrers* = `https://thiennvdn.github.io/*` và chỉ cho phép *Generative Language API*.

## Công nghệ | Tech

Vite · React 19 · Tailwind CSS 3 · Gemini 2.5 Flash (REST, gọi trực tiếp từ trình duyệt) · html2canvas · jsPDF

Không có backend; ảnh giấy tờ chỉ gửi tới Google Gemini để đọc, không lưu ở đâu khác. | No backend; document images are sent only to Google Gemini for extraction and stored nowhere else.
