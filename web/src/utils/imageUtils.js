export { convertFileToBase64 } from './imageCompression';

export const handleImageSelect = (maxImages, currentImages, onImageAdd) => {
  return async (event) => {
    const files = Array.from(event.target.files);
    const remainingSlots = maxImages - currentImages.length;
    
    if (files.length > remainingSlots) {
      alert(`Maximum ${maxImages} images allowed. You can add ${remainingSlots} more.`);
      return;
    }

    const { compressImageToBase64 } = await import('./imageCompression');
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          // Compress image before converting to base64
          const compressedBase64 = await compressImageToBase64(file, 1920, 0.8);
          onImageAdd(compressedBase64);
        } catch (error) {
          console.error('Error processing image:', error);
          alert('Error processing image');
        }
      }
    }

    // Reset input
    event.target.value = '';
  };
};

