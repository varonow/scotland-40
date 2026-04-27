/* ============================================
   SCOTLAND 40 — Image Compression Helper
   js/image-compress.js

   Resizes phone photos to ~1600px on the long edge
   and re-encodes as JPEG at 85% quality.
   Typical 5MB photo → ~250–500 KB.

   Usage:
     const compressed = await compressImage(file);
     // compressed is a File object you can upload directly
   ============================================ */

async function compressImage(file, options = {}) {
  // If it's already small or not an image, just return it
  if (!file.type.startsWith('image/')) return file;
  if (file.size < 500 * 1024) return file; // under 500KB, leave it alone

  const maxDimension = options.maxDimension || 1600;
  const quality = options.quality || 0.85;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions, preserving aspect ratio
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }

      // Draw to canvas at new size
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Compression failed — return original
            resolve(file);
            return;
          }
          // Build a clean filename ending in .jpg
          const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          const compressed = new File([blob], newName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback: return original on error
    };

    img.src = url;
  });
}