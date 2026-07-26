'use client';
import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface LightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({ images, index, onClose, onPrev, onNext }: LightboxProps) {
  if (images.length === 0) return null;
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-[20px] z-[2000] flex items-center justify-center animate-in fade-in-0 duration-200" onClick={onClose}>
      <button className="absolute top-6 right-6 bg-white/85 hover:bg-white border border-white/10 text-black hover:scale-105 rounded-full w-11 h-11 flex items-center justify-center cursor-pointer transition-all z-[2010]" onClick={onClose}>
        <X size={22} />
      </button>
      {images.length > 1 && (
        <>
          <button
            className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white border border-white/10 text-black rounded-full w-14 h-14 flex items-center justify-center cursor-pointer hover:scale-105 transition-all z-[2010]"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <ChevronLeft size={36} />
          </button>
          <button
            className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white border border-white/10 text-black rounded-full w-14 h-14 flex items-center justify-center cursor-pointer hover:scale-105 transition-all z-[2010]"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <ChevronRight size={36} />
          </button>
        </>
      )}
      <div className="relative max-w-[80vw] max-h-[80vh] flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[index]}
          alt={`View ${index + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-200"
        />
        {images.length > 1 && (
          <div className="bg-black/60 px-4 py-1.5 rounded-full text-white text-sm border border-white/10">
            Image {index + 1} of {images.length}
          </div>
        )}
      </div>
    </div>
  );
}
