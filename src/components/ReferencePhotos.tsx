import React from 'react';

interface ReferencePhotosProps {
  photos: string[];
}

const ReferencePhotos: React.FC<ReferencePhotosProps> = ({ photos }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map((photo, index) => (
        <div key={index} className="relative">
          <img
            src={photo}
            alt={`Reference ${index + 1}`}
            className="w-full rounded-lg border border-gray-200"
          />
          <span className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
            Reference {index + 1}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ReferencePhotos;