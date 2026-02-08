'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { useCart } from '@/app/lib/cart-context';
import { ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';
import type { Product, ProductWithCategory } from '@/app/lib/definitions';

export function ProductGrid({ products }: { products: (Product | ProductWithCategory | null)[] }) {
  const validProducts = products.filter((p): p is Product | ProductWithCategory => p !== null);
  const { addItem } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getDisplayPrice = (product: Product) => {
    const original = product.price;
    const sale = product.isOnSale && product.salePrice ? product.salePrice : null;

    if (sale !== null) {
      return {
        original: formatPrice(original),
        sale: formatPrice(sale),
        isOnSale: true,
        percentage: Math.round(((original - sale) / original) * 100),
      };
    }
    return {
      original: formatPrice(original),
      sale: null,
      isOnSale: false,
    };
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;

    addItem({
      id: product.id,
      name: product.name,
      price: effectivePrice,
      quantity: 1,
      imagePath: product.images && product.images.length > 0 ? product.images[0] : '',
    });

    setAddingId(product.id);
    setTimeout(() => setAddingId(null), 2000);
  };

  return (
    <div className="grid grid-cols-2 gap-y-10 gap-x-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-8">
      {validProducts.map((product, index) => {
        const priceDisplay = getDisplayPrice(product);
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;
        const isAdding = addingId === product.id;
        const isOutOfStock = product.stock !== undefined && product.stock <= 0;
        
        return (
          <motion.div
             key={product.id}
             initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-50px" }}
             transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : index * 0.05 }}
          >
            <Link href={`/products/${product.id}`} className="group block">
              {/* Image with subtle zoom */}
              <div className="relative mb-4 aspect-3/4 w-full overflow-hidden bg-[#F0EBE0]">
                {/* Sale Badge */}
                {priceDisplay.isOnSale && (
                  <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold tracking-wide rounded-full">
                    {priceDisplay.percentage}% OFF
                  </div>
                )}
                
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-3xl text-foreground/10 italic">RR</span>
                  </div>
                )}
                
                {/* "Quick Add" overlay - Now with Add to Cart button */}
                <div className="absolute bottom-0 left-0 w-full translate-y-0 lg:translate-y-full bg-white/90 py-2 px-3 backdrop-blur-sm transition-transform duration-300 lg:group-hover:translate-y-0 flex items-center justify-between gap-2">
                   <span className="font-sans text-[9px] font-medium tracking-widest text-foreground uppercase truncate">View Details</span>
                   <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={isOutOfStock || isAdding}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none ${
                      isAdding 
                        ? 'bg-green-600 text-white' 
                        : isOutOfStock 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                    aria-label={isAdding ? "Added to cart" : isOutOfStock ? "Out of stock" : `Add ${product.name} to cart`}
                   >
                     {isAdding ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                   </button>
                </div>
              </div>

              {/* Minimal Info */}
              <div className="text-center">
                 <p className="font-sans text-xl text-foreground group-hover:text-primary transition-colors">
                   {product.name}
                 </p>
                 <div className="mt-1 flex items-center justify-center gap-1.5 flex-wrap tabular-nums">
                    <span className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 tabular-nums">
                      {('categoryRef' in product && product.categoryRef) 
                        ? product.categoryRef.name 
                        : (product.category || 'Uncategorized')}
                    </span>
                    <span className="h-0.5 w-0.5 rounded-full bg-foreground/30" />
                    {priceDisplay.isOnSale ? (
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-xs text-foreground/40 line-through">
                          {priceDisplay.original}
                        </span>
                        <span className="font-sans text-xs font-semibold text-primary">
                          {priceDisplay.sale}
                        </span>
                      </div>
                    ) : (
                      <span className="font-sans text-xs font-medium text-foreground/80">
                        {priceDisplay.original}
                      </span>
                    )}
                 </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
