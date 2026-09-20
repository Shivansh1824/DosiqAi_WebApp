/**
 * Compresses an uploaded image file on the client side using HTML5 Canvas.
 * Keeps output under ~30-50KB for snappy storage in Supabase & instant UI rendering.
 *
 * @param {File} file - The uploaded image file from input[type="file"]
 * @param {number} maxDim - Maximum width/height in pixels (default: 360)
 * @param {number} quality - JPEG compression quality 0-1 (default: 0.85)
 * @returns {Promise<string>} Base64 data URL
 */
export const compressAvatarFile = (file, maxDim = 360, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(e.target.result);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};
