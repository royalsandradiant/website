'use client';

import { useState } from 'react';
import { createHeroImage, deleteHeroImage, reorderHeroImages, updateHeroImageViewport } from '@/app/lib/actions';
import type { HeroImage, HeroViewport } from '@/app/lib/definitions';
import { AnimatePresence, Reorder } from 'motion/react';
import Image from 'next/image';

export default function HeroImagesForm({ initialImages }: { initialImages: HeroImage[] }) {
  const [images, setImages] = useState<HeroImage[]>(initialImages);
  const [uploadViewport, setUploadViewport] = useState<HeroViewport>('desktop');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll('image') as File[];
    
    if (files.length === 0 || (files.length === 1 && files[0].size === 0)) return;

    // Client-side size check (e.g., 10MB per file)
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Please upload images smaller than 10MB.`);
        return;
      }
    }

    setIsUploading(true);
    try {
      const result = await createHeroImage(formData);
      if (result.success) {
        form.reset();
        setUploadViewport('desktop');
        // Update local state to show the new images immediately
        if (result.images) {
          const rawImages = result.images as Array<
            Omit<HeroImage, 'viewport'> & { viewport?: string | null }
          >;
          const uploadedImages: HeroImage[] = rawImages.map((image) => ({
            ...image,
            viewport: image.viewport === 'mobile' ? 'mobile' : 'desktop',
          }));
          setImages((prev) => [...prev, ...uploadedImages]);
        }
      } else {
        setError(result.error || 'Failed to upload images');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('An unexpected error occurred. Please try smaller files or check your connection.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this image?')) {
      setError('');
      // Optimistic update
      setImages(prev => prev.filter(img => img.id !== id));
      const result = await deleteHeroImage(id);
      if (!result.success) {
        setError(result.error || 'Failed to delete image');
        // Revert if failed (though revalidatePath usually handles this)
        window.location.reload();
      }
    }
  };

  const handleReorder = async (newOrder: HeroImage[]) => {
    setError('');
    setImages(newOrder);
    const orderedIds = newOrder.map((img, idx) => ({ id: img.id, sortOrder: idx }));
    const result = await reorderHeroImages(orderedIds);
    if (!result.success) {
      setError(result.error || 'Failed to reorder hero images.');
    }
  };

  const handleViewportChange = async (id: string, viewport: HeroViewport) => {
    setError('');
    const previous = images;
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, viewport } : img)),
    );
    const result = await updateHeroImageViewport(id, viewport);
    if (!result.success) {
      setError(result.error || 'Failed to update viewport target.');
      setImages(previous);
    }
  };

  return (
    <div className="space-y-10">
      {/* Upload Form */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-stone-50/50">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Add New Hero Image</h3>
        </div>
        <form onSubmit={handleUpload} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-5">
              <label htmlFor="hero-image-file" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Image File
              </label>
              <div className="relative group">
                <input 
                  id="hero-image-file"
                  name="image" 
                  type="file" 
                  required 
                  multiple
                  accept="image/*" 
                  className="block w-full text-sm text-stone-500
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-lg file:border-0
                    file:text-xs file:font-bold
                    file:bg-stone-100 file:text-stone-700
                    hover:file:bg-stone-200
                    cursor-pointer transition-all" 
                />
              </div>
            </div>
            
            <div className="md:col-span-3">
              <label htmlFor="hero-image-alt" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Alt Text (SEO)
              </label>
              <input 
                id="hero-image-alt"
                name="altText" 
                type="text" 
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" 
                placeholder="e.g. New Winter Collection 2026" 
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="hero-image-viewport" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Viewport
              </label>
              <select
                id="hero-image-viewport"
                name="viewport"
                value={uploadViewport}
                onChange={(e) => setUploadViewport(e.target.value as HeroViewport)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button 
                type="submit" 
                disabled={isUploading} 
                className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving
                  </span>
                ) : 'Add Image'}
              </button>
            </div>
          </div>
        </form>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* List / Reorder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Current Carousel ({images.length})
          </h3>
          {images.length > 1 && (
            <span className="text-[10px] text-stone-400 italic">Drag to reorder</span>
          )}
        </div>

        <Reorder.Group axis="y" values={images} onReorder={handleReorder} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {images.map((img) => (
              <Reorder.Item 
                key={img.id} 
                value={img}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
              <div className="flex items-center gap-6 p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-accent/30 transition-all cursor-grab active:cursor-grabbing group">
                <div className="flex flex-col items-center justify-center gap-1 text-stone-300 group-hover:text-accent transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
                
                <div className="h-16 w-28 relative overflow-hidden rounded-lg bg-stone-100 border border-border/50 shrink-0">
                  <Image 
                    src={img.imageUrl} 
                    alt={img.altText || 'Hero image preview'}
                    fill
                    sizes="112px"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {img.altText || <span className="text-stone-400 italic font-normal">No description</span>}
                  </p>
                  <p className="mt-1">
                    <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                      {img.viewport === 'mobile' ? 'Mobile' : 'Desktop'}
                    </span>
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate max-w-xs">
                    {img.imageUrl.split('/').pop()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={img.viewport}
                    onChange={(e) => handleViewportChange(img.id, e.target.value as HeroViewport)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground/70"
                    aria-label="Select viewport target"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="mobile">Mobile</option>
                  </select>
                  <button 
                    type="button"
                    onClick={() => handleDelete(img.id)} 
                    className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete image"
                    aria-label="Delete image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
            </Reorder.Item>
          ))}
          </AnimatePresence>
        </Reorder.Group>
        
        {images.length === 0 && (
          <div className="py-12 text-center bg-stone-50/50 rounded-xl border-2 border-dashed border-stone-200">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <p className="text-sm text-stone-500 font-medium">No hero images uploaded yet</p>
            <p className="text-xs text-stone-400 mt-1">The default background will be used on the homepage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
