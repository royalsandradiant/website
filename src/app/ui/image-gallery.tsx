'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

export default function ImageGallery({ images, name, variants }: { images: string[], name: string, variants?: any[] }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullSize, setIsFullSize] = useState(false);

  // Sync with variants
  useEffect(() => {
    // If a variant is selected and has an image, it might be passed here or handled in a parent
  }, [variants]);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary aspect-[3/4] rounded-lg">
        <span className="font-display text-6xl text-foreground/10">RR</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        className="relative overflow-hidden rounded-lg bg-secondary aspect-[3/4] cursor-zoom-in group shadow-sm hover:shadow-md transition-shadow"
        onClick={() => setIsFullSize(true)}
      >
        <Image
          src={images[selectedImage]}
          alt={name}
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </div>
      </div>
      
      {images.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative h-20 w-20 overflow-hidden rounded-md border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                selectedImage === index ? 'border-primary' : 'border-transparent hover:border-primary/50'
              }`}
              aria-label={`View ${name} image ${index + 1}`}
              aria-current={selectedImage === index ? 'true' : 'false'}
            >
              <Image
                src={image}
                alt={`${name} thumbnail ${index + 1}`}
                fill
                className="object-cover object-center"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full Size Modal */}
      <AnimatePresence>
        {isFullSize && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10 cursor-zoom-out"
            onClick={() => setIsFullSize(false)}
          >
            <div className="relative h-full w-full">
              <Image
                src={images[selectedImage]}
                alt={name}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            <button 
              className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setIsFullSize(false); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
