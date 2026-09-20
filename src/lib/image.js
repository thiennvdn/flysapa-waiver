// Downscales a photo before upload: VNeID screenshots and phone photos are
// 3-4k px, which costs tokens and time without improving OCR.
export function fileToResizedBase64(file, maxPx = 1600) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve({ mimeType: 'image/jpeg', data: dataUrl.split(',')[1] });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Cannot read image ${file.name}`));
    };
    img.src = url;
  });
}
