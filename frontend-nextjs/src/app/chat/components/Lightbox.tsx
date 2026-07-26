'use client';
import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from '../chat.module.css';

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
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <button className={styles.lightboxClose} onClick={onClose}>
        <X size={22} />
      </button>
      {images.length > 1 && (
        <>
          <button
            className={styles.lightboxPrev}
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <ChevronLeft size={36} />
          </button>
          <button
            className={styles.lightboxNext}
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <ChevronRight size={36} />
          </button>
        </>
      )}
      <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
        <img
          src={images[index]}
          alt={`View ${index + 1}`}
          className={styles.lightboxImage}
        />
        {images.length > 1 && (
          <div className={styles.lightboxCounter}>
            Image {index + 1} of {images.length}
          </div>
        )}
      </div>
    </div>
  );
}
