'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ImageGallery({ images, name }: { images: string[], name: string }) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary aspect-[3/4] rounded-lg">
        <span className="font-display text-6xl text-foreground/10">RR</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg bg-secondary aspect-[3/4]">
        <Image
          src={images[selectedImage]}
          alt={name}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
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
                sizes="10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
