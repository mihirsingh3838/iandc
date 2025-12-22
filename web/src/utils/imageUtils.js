export const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const handleImageSelect = (maxImages, currentImages, onImageAdd) => {
  return (event) => {
    const files = Array.from(event.target.files);
    const remainingSlots = maxImages - currentImages.length;
    
    if (files.length > remainingSlots) {
      alert(`Maximum ${maxImages} images allowed. You can add ${remainingSlots} more.`);
      return;
    }

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        convertFileToBase64(file).then((base64) => {
          onImageAdd(base64);
        }).catch((error) => {
          console.error('Error converting image:', error);
          alert('Error processing image');
        });
      }
    });

    // Reset input
    event.target.value = '';
  };
};

