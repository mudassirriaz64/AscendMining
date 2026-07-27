import { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import Modal from './Modal';

const ImageGallery = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images?.length) {
    return (
      <div className="text-center py-8 text-sm text-text-secondary">
        No screenshots found.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div
            key={img._id || idx}
            className="group relative aspect-square rounded-lg overflow-hidden border border-border-light cursor-pointer"
            onClick={() => setSelectedImage(img)}
          >
            <img
              src={img.screenshot}
              alt={`Screenshot ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-[10px] text-white">${img.amount}</p>
              <p className="text-[10px] text-white/70">{new Date(img.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} size="xl">
        {selectedImage && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={selectedImage.screenshot}
              alt="Screenshot"
              className="max-w-full max-h-[60vh] object-contain rounded-lg"
            />
            <div className="text-sm text-text-secondary">
              ${selectedImage.amount} — {new Date(selectedImage.createdAt).toLocaleString()}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ImageGallery;
