/**
 * Client-side image compression utility
 * Compresses images before storing as base64 to reduce DB size
 */

const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;

/**
 * Compress an image File to a base64 data URL (JPEG)
 * - Resizes if larger than MAX_IMAGE_DIMENSION on any side
 * - Converts to JPEG at 75% quality
 * - Returns full data URL string: "data:image/jpeg;base64,..."
 */
export async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Resize if needed
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height / width) * MAX_IMAGE_DIMENSION);
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round((width / height) * MAX_IMAGE_DIMENSION);
            height = MAX_IMAGE_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        if (dataUrl && dataUrl.length > 50) {
          resolve(dataUrl);
        } else {
          reject(new Error('Failed to compress image'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get estimated size of a base64 data URL in KB
 */
export function getBase64SizeKb(dataUrl: string): number {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4 / 1024);
}
