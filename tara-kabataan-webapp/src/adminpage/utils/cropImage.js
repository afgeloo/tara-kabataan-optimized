export const getCroppedImg = async (imageSrc, crop) => {
    const img = await new Promise((res, rej) => {
        const i = new Image();
        i.src = imageSrc;
        i.onload = () => res(i);
        i.onerror = rej;
    });
    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg'));
};
