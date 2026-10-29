/**
 * Compresses an image file or dataURL to a lightweight JPEG (max 600x600, ~30-60KB)
 * so it effortlessly fits within Firestore's 1MB document limit and loads instantly on 3G/4G.
 */
export async function compressImage(fileOrDataUrl: File | string, maxWidth = 600, maxHeight = 600, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    let src = '';
    if (typeof fileOrDataUrl === 'string') {
      src = fileOrDataUrl;
      processImageSrc(src);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        src = (e.target?.result as string) || '';
        processImageSrc(src);
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }

    function processImageSrc(source: string) {
      if (!source) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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
          resolve(source);
          return;
        }

        // Draw and compress to lightweight JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        // If it cannot be parsed by Image, return original or empty
        resolve(source);
      };
      img.src = source;
    }
  });
}
