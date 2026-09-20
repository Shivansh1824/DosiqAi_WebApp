import { jsPDF } from 'jspdf';

/**
 * Loads an image from a Data URL and resolves its natural dimensions.
 * @param {string} dataUrl - Base64 or Object URL of the image
 * @returns {Promise<HTMLImageElement>}
 */
const loadImage = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image for PDF compilation: ' + err));
    img.src = dataUrl;
  });
};

/**
 * Converts a data URL to a binary Blob.
 * @param {string} dataUrl 
 * @param {string} defaultMime 
 * @returns {Blob}
 */
export const dataUrlToBlob = (dataUrl, defaultMime = 'image/jpeg') => {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : defaultMime;
  const binaryString = atob(parts[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
};

/**
 * Compiles an array of medical document images into a single multi-page A4 PDF.
 * Maintains aspect ratio, centers each image, and applies clinical padding.
 * 
 * @param {Array<{ dataUrl: string, type?: string, name?: string }>} files
 * @param {Object} [options]
 * @param {string} [options.title] - Optional document title for PDF metadata
 * @returns {Promise<{ pdfBlob: Blob, pdfDataUrl: string, pageCount: number }>}
 */
export const compileImagesToPdf = async (files = [], options = {}) => {
  if (!files || files.length === 0) {
    throw new Error('No files provided for PDF compilation');
  }

  // A4 Dimensions in millimeters
  const A4_WIDTH = 210;
  const A4_HEIGHT = 297;
  const MARGIN = 10;
  const PRINTABLE_WIDTH = A4_WIDTH - (MARGIN * 2);   // 190mm
  const PRINTABLE_HEIGHT = A4_HEIGHT - (MARGIN * 2); // 277mm

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  if (options.title) {
    pdf.setDocumentProperties({
      title: options.title,
      subject: 'Dosiq AI Clinical Medical Record',
      creator: 'Dosiq AI Medical Vault',
    });
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!file.dataUrl) continue;

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    try {
      const img = await loadImage(file.dataUrl);
      const imgRatio = img.width / img.height;
      const pageRatio = PRINTABLE_WIDTH / PRINTABLE_HEIGHT;

      let renderWidth, renderHeight;

      if (imgRatio > pageRatio) {
        // Image is wider than printable area
        renderWidth = PRINTABLE_WIDTH;
        renderHeight = PRINTABLE_WIDTH / imgRatio;
      } else {
        // Image is taller than printable area
        renderHeight = PRINTABLE_HEIGHT;
        renderWidth = PRINTABLE_HEIGHT * imgRatio;
      }

      // Center horizontally & vertically inside printable area
      const posX = MARGIN + ((PRINTABLE_WIDTH - renderWidth) / 2);
      const posY = MARGIN + ((PRINTABLE_HEIGHT - renderHeight) / 2);

      const imageFormat = file.type?.includes('png') ? 'PNG' : 'JPEG';
      pdf.addImage(file.dataUrl, imageFormat, posX, posY, renderWidth, renderHeight, undefined, 'FAST');
    } catch (err) {
      console.warn(`Could not render page ${i + 1} into PDF:`, err);
    }
  }

  const pdfBlob = pdf.output('blob');
  const pdfDataUrl = pdf.output('datauristring');

  return {
    pdfBlob,
    pdfDataUrl,
    pageCount: files.length,
  };
};
