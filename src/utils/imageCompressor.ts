/**
 * Utility to downscale and compress base64 images to prevent localStorage quota exhaustion.
 */
export const compressImage = (
  base64Str: string,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.6
): Promise<string> => {
  return new Promise((resolve) => {
    // If it's not a compressible image format base64, return as is
    if (!base64Str.startsWith('data:image/') || base64Str.startsWith('data:image/svg')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Return immediately if it's already tiny
      if (width <= maxWidth && height <= maxHeight && base64Str.length < 50000) {
        resolve(base64Str);
        return;
      }

      // Calculate new dimensions preserving aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      // Fill with transparent or white background before drawing
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Determine the image type from original base64
      let mimeType = 'image/jpeg';
      const match = base64Str.match(/data:([^;]+);/);
      if (match && match[1]) {
        if (match[1] === 'image/png') {
          // If original was PNG, we can compress using PNG or JPEG.
          // JPEG offers much better compression, but PNG preserves transparency.
          // Since this is for avatars/attachments, JPEG quality compression is preferred unless small.
          mimeType = 'image/jpeg';
        } else if (match[1] === 'image/webp') {
          mimeType = 'image/webp';
        } else if (match[1] === 'image/gif') {
          // Gif compression is tricky, return original
          resolve(base64Str);
          return;
        }
      }

      // Convert to compressed base64
      try {
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        // Ensure compressed size is actually smaller, otherwise use original
        if (compressedDataUrl.length < base64Str.length) {
          resolve(compressedDataUrl);
        } else {
          resolve(base64Str);
        }
      } catch (e) {
        console.error('Error generating compressed base64', e);
        resolve(base64Str);
      }
    };

    img.onerror = () => {
      resolve(base64Str);
    };
  });
};
