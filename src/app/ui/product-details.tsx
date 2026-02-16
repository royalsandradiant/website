'use client';

import { useState } from 'react';
import ImageGallery from '@/app/ui/image-gallery';
import AddToCart from '@/app/ui/add-to-cart';
import { Ruler, X } from 'lucide-react';

interface ProductDetailsProps {
  product: any;
  categoryBreadcrumb: any[];
  settings: any;
}

export default function ProductDetails({ product, categoryBreadcrumb, settings }: ProductDetailsProps) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);

  if (!product) return null;

  const isOnSale = product.isOnSale && product.salePrice;
  const displayPrice = isOnSale ? Number(product.salePrice) : Number(product.price);
  const originalPrice = Number(product.price);
  
  // Calculate sale percentage
  const salePercentage = isOnSale 
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) 
    : 0;

  // Logic for images: if variant selected and has images, show those. Otherwise show product images.
  const galleryImages = (selectedVariant?.images && selectedVariant.images.length > 0)
    ? selectedVariant.images
    : product.images;

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      {/* Product Image Gallery */}
      <div className="relative lg:col-span-5 xl:col-span-4">
        {/* Sale Badge */}
        {isOnSale && (
          <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold tracking-wide rounded-full shadow-lg">
            {salePercentage}% OFF
          </div>
        )}
        
        <ImageGallery 
          key={selectedVariant?.id || 'default'} 
          images={galleryImages} 
          name={product.name} 
        />
      </div>

      {/* Product Details */}
      <div className="flex flex-col lg:col-span-7 xl:col-span-8">
        {product.categoryRef && (
          <div className="mb-2">
            <span className="text-sm font-medium tracking-widest text-primary uppercase">
              {categoryBreadcrumb.map(c => c.name).join(' • ')}
            </span>
          </div>
        )}
        
        <p className="font-sans text-4xl md:text-5xl text-foreground mb-4">
          {product.name}
        </p>

        {product.sizeChartUrl && (
          <button 
            type="button"
            onClick={() => setShowSizeChart(true)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-6 group"
          >
            <Ruler className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            <span className="underline underline-offset-4">View Size Guide</span>
          </button>
        )}
        
        {/* Delivery Info */}
        <div className="mb-6 flex w-full items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-sm text-foreground/60 sm:w-auto sm:items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500" aria-hidden="true"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
          <span>Estimated delivery: <strong>{settings.estimatedDeliveryMin} to {settings.estimatedDeliveryMax} business days</strong></span>
        </div>
        
        {/* Price */}
        <div className="mb-8">
          {isOnSale ? (
            <div className="flex items-center gap-4">
              <span className="text-3xl font-medium text-foreground/40 line-through">
                ${originalPrice.toFixed(2)}
              </span>
              <span className="text-3xl font-bold text-primary">
                ${displayPrice.toFixed(2)}
              </span>
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20 shadow-sm">
                Save ${(originalPrice - displayPrice).toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-3xl font-bold text-foreground">
              ${displayPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mb-8 border-t pt-8">
          <p className="text-foreground/70 leading-relaxed text-lg whitespace-pre-wrap">
            {product.description}
          </p>
        </div>

        {/* Product Meta Info */}
        <div className="mb-8 p-6 bg-secondary/30 rounded-xl space-y-4 border border-border/40">
          <div className="flex flex-col gap-1 border-b border-border/40 pb-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-foreground/60 uppercase tracking-tighter font-bold">Availability</span>
            <span className={`font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </span>
          </div>
          <div className="flex flex-col gap-1 border-b border-border/40 pb-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-foreground/60 uppercase tracking-tighter font-bold">Returns</span>
            <span className="font-bold text-red-500/80 sm:text-right">All sales final. No returns or exchanges.</span>
          </div>
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-foreground/60 uppercase tracking-tighter font-bold">Standard Shipping</span>
            <span className="text-foreground font-medium italic">Calculated at checkout</span>
          </div>
        </div>

        <AddToCart 
          product={product} 
          onVariantChange={setSelectedVariant} 
        />
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && product.sizeChartUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-display text-2xl">Size Guide</h3>
              <button 
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="p-2 hover:bg-secondary/50 rounded-full transition-colors"
                aria-label="Close size guide"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex justify-center bg-secondary/10">
              <img 
                src={product.sizeChartUrl} 
                alt="Size Chart" 
                className="max-w-full h-auto rounded-lg shadow-sm"
              />
            </div>
            <div className="p-6 border-t bg-white text-center">
              <p className="text-sm text-foreground/60 italic">
                * Measurements are in inches unless otherwise specified. If you are between sizes, we recommend sizing up.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="absolute inset-0 -z-10" 
            onClick={() => setShowSizeChart(false)}
            aria-label="Close size guide overlay"
          />
        </div>
      )}
    </div>
  );
}
