/**
 * Image compression utility
 * Compresses images to reduce file size before upload
 */

/**
 * Compress an image from base64 string
 * @param {string} base64String - Base64 encoded image string
 * @param {number} maxWidth - Maximum width (default: 1920)
 * @param {number} maxHeight - Maximum height (default: 1080)
 * @param {number} quality - JPEG quality 0-1 (default: 0.8)
 * @param {number} maxSizeKB - Maximum file size in KB (default: 500)
 * @returns {Promise<string>} - Compressed base64 string
 */
export const compressImage = async (
  base64String,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8,
  maxSizeKB = 500
) => {
  return new Promise((resolve, reject) => {
    try {
      // Remove data URL prefix if present
      let base64Data = base64String;
      if (base64String.includes(',')) {
        base64Data = base64String.split(',')[1];
      } else if (base64String.startsWith('data:')) {
        // Handle case where there's a data URL prefix but no comma (shouldn't happen, but handle it)
        const parts = base64String.split('base64,');
        base64Data = parts.length > 1 ? parts[1] : base64String;
      }

      // Create image element
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = Math.min(width, maxWidth);
              height = width / aspectRatio;
            } else {
              height = Math.min(height, maxHeight);
              width = height * aspectRatio;
            }
          }

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob first to check size
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeKB = blob.size / 1024;

              // If still too large, reduce quality further
              if (sizeKB > maxSizeKB) {
                const newQuality = Math.max(0.3, quality * (maxSizeKB / sizeKB));
                canvas.toBlob(
                  (finalBlob) => {
                    if (!finalBlob) {
                      reject(new Error('Failed to compress image'));
                      return;
                    }

                    const reader = new FileReader();
                    reader.onloadend = () => {
                      resolve(reader.result);
                    };
                    reader.onerror = () => {
                      reject(new Error('Failed to read compressed image'));
                    };
                    reader.readAsDataURL(finalBlob);
                  },
                  'image/jpeg',
                  newQuality
                );
              } else {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve(reader.result);
                };
                reader.onerror = () => {
                  reject(new Error('Failed to read compressed image'));
                };
                reader.readAsDataURL(blob);
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(new Error(`Image compression error: ${error.message}`));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      // Load image from base64
      img.src = `data:image/jpeg;base64,${base64Data}`;
    } catch (error) {
      reject(new Error(`Image compression setup error: ${error.message}`));
    }
  });
};

/**
 * Get image size in KB from base64 string
 * @param {string} base64String - Base64 encoded image string
 * @returns {number} - Size in KB
 */
export const getImageSizeKB = (base64String) => {
  try {
    const base64Data = base64String.includes(',') 
      ? base64String.split(',')[1] 
      : base64String;
    
    // Approximate size calculation (base64 is ~33% larger than binary)
    const binarySize = (base64Data.length * 3) / 4;
    return binarySize / 1024;
  } catch (error) {
    console.error('Error calculating image size:', error);
    return 0;
  }
};
