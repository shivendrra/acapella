import React, { useRef, useEffect, useState } from 'react';
import { X, Crop } from 'lucide-react';

interface ImageCropModalProps {
  src: string;
  onClose: () => void;
  onCropped: (blob: Blob) => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ src, onClose, onCropped }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const canvasSize = 256;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      const sourceSize = Math.min(img.width, img.height);
      const sourceX = (img.width - sourceSize) / 2;
      const sourceY = (img.height - sourceSize) / 2;
      
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        canvasSize,
        canvasSize
      );
    };

    img.onerror = () => {
      setError("Failed to load the image. It might be corrupted or in an unsupported format.");
    };
  }, [src]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onCropped(blob);
      } else {
        setError("Could not process the image. Please try another one.");
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-ac-light dark:bg-ac-dark rounded-lg shadow-2xl w-full max-w-sm relative p-6 space-y-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-serif">Crop your new photo</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex justify-center items-center">
          <canvas ref={canvasRef} className="rounded-full w-48 h-48 border-2 border-dashed border-gray-400"></canvas>
        </div>

        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          A square crop will be taken from the center of your image.
        </p>

        {error && <div className="text-sm text-ac-danger text-center p-3 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-500/50 rounded-md">{error}</div>}

        <div className="flex justify-end space-x-4 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-ac-primary hover:bg-ac-primary/90 dark:bg-ac-secondary dark:hover:bg-ac-secondary/90 rounded-md">
            <Crop size={16} className="mr-2" />
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;