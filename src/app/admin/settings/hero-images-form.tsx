'use client';

import { useState } from 'react';
import { createHeroImage, deleteHeroImage, reorderHeroImages } from '@/app/lib/actions';
import type { HeroImage } from '@/app/lib/definitions';
import { motion, Reorder } from 'motion/react';

export default function HeroImagesForm({ initialImages }: { initialImages: HeroImage[] }) {
  const [images, setImages] = useState<HeroImage[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createHeroImage(formData);
    if (result.success) {
      // Form reset logic
      (e.target as HTMLFormElement).reset();
    }
    setIsUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this image?')) {
      await deleteHeroImage(id);
    }
  };

  const handleReorder = async (newOrder: HeroImage[]) => {
    setImages(newOrder);
    const orderedIds = newOrder.map((img, idx) => ({ id: img.id, sortOrder: idx }));
    await reorderHeroImages(orderedIds);
  };

  return (
    <div className="space-y-8">
      {/* Upload Form */}
      <form onSubmit={handleUpload} className="p-4 bg-white rounded-md border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Upload New Hero Image</label>
          <input name="image" type="file" required accept="image/*" className="w-full text-sm" />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Alt Text</label>
          <input name="altText" type="text" className="w-full rounded border border-gray-300 p-2 text-sm" placeholder="e.g. Summer Collection" />
        </div>
        <button type="submit" disabled={isUploading} className="bg-purple-600 text-white rounded px-6 py-2 text-sm font-bold hover:bg-purple-700 disabled:opacity-50">
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {/* List / Reorder */}
      <Reorder.Group axis="y" values={images} onReorder={handleReorder} className="space-y-3">
        {images.map((img) => (
          <Reorder.Item key={img.id} value={img}>
            <div className="flex items-center gap-4 p-3 bg-white rounded-md border border-gray-200 shadow-sm cursor-move group">
              <div className="flex items-center justify-center w-6 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
              </div>
              <div className="h-12 w-20 relative overflow-hidden rounded bg-gray-100">
                <img src={img.imageUrl} alt={img.altText || ''} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{img.altText || 'No description'}</p>
                <p className="text-[10px] text-gray-400 truncate max-w-xs">{img.imageUrl}</p>
              </div>
              <button onClick={() => handleDelete(img.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      
      {images.length === 0 && (
        <p className="text-center text-gray-400 text-sm italic">No hero images uploaded yet. The default background will be used.</p>
      )}
    </div>
  );
}
