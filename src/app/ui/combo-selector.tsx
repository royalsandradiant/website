'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/app/lib/cart-context';
import { Check, Plus, ShoppingBag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Product } from '@/app/lib/definitions';

interface ComboSelectorProps {
  products: Product[];
  comboPrice: number;
}

export default function ComboSelector({ products, comboPrice }: ComboSelectorProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCart();

  const totalOriginalPrice = selectedProducts.reduce((sum, p) => {
    const price = p.isOnSale && p.salePrice ? p.salePrice : p.price;
    return sum + price;
  }, 0);

  const savings = totalOriginalPrice - comboPrice;

  const toggleProduct = (product: Product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else if (selectedProducts.length < 3) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleAddComboToCart = () => {
    if (selectedProducts.length !== 3) return;

    // Generate a unique combo ID for tracking
    const comboId = `combo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Calculate the price per item (distribute combo price evenly)
    const pricePerItem = comboPrice / 3;

    // Add each product to cart with combo metadata
    selectedProducts.forEach((product, index) => {
      addItem({
        id: `${product.id}-${comboId}`,
        name: `${product.name} (Combo ${index + 1}/3)`,
        price: pricePerItem,
        quantity: 1,
        imagePath: product.images && product.images.length > 0 ? product.images[0] : '',
        comboId,
        originalProductId: product.id,
      });
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setSelectedProducts([]);
    }, 2000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="space-y-8">
      {/* Selection Summary Bar */}
      <div className="sticky top-20 z-20 bg-background/95 backdrop-blur-md border border-border rounded-xl p-4 md:p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-display text-lg text-foreground mb-2">
              Your Combo Selection ({selectedProducts.length}/3)
            </h3>
            
            {/* Selected Products Preview */}
            <div className="flex gap-2 min-h-[60px]">
              {[0, 1, 2].map((index) => {
                const product = selectedProducts[index];
                return (
                  <div
                    key={index}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      product ? 'border-primary' : 'border-dashed border-border'
                    }`}
                  >
                    {product ? (
                      <>
                        <Image
                          src={product.images?.[0] || ''}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                        <button
                          type="button"
                          onClick={() => removeProduct(product.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                        <Plus className="w-4 h-4 text-foreground/30" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing */}
          <div className="flex flex-col md:items-end gap-2">
            {selectedProducts.length === 3 && (
              <div className="flex items-center gap-3">
                <span className="text-foreground/50 line-through text-lg">
                  {formatPrice(totalOriginalPrice)}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(comboPrice)}
                </span>
              </div>
            )}
            {selectedProducts.length === 3 && savings > 0 && (
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Save {formatPrice(savings)}!
              </span>
            )}
            <button
              type="button"
              onClick={handleAddComboToCart}
              disabled={selectedProducts.length !== 3 || isAdded}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedProducts.length !== 3
                  ? 'bg-foreground/10 text-foreground/40 cursor-not-allowed'
                  : isAdded
                  ? 'bg-green-600 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  {selectedProducts.length === 3
                    ? 'Add Combo to Cart'
                    : `Select ${3 - selectedProducts.length} more item${3 - selectedProducts.length !== 1 ? 's' : ''}`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
        {products.map((product) => {
          const isSelected = selectedProducts.find(p => p.id === product.id);
          const isDisabled = !isSelected && selectedProducts.length >= 3;
          const displayPrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;
          const isOutOfStock = product.stock <= 0;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button
                type="button"
                onClick={() => !isOutOfStock && toggleProduct(product)}
                disabled={isOutOfStock || (isDisabled && !isSelected)}
                className={`w-full text-left rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 scale-[1.02]'
                    : isDisabled || isOutOfStock
                    ? 'border-border opacity-50 cursor-not-allowed'
                    : 'border-border hover:border-primary/50 hover:shadow-md'
                }`}
              >
                {/* Image */}
                <div className="relative aspect-square bg-secondary">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-2xl text-foreground/10">RR</span>
                    </div>
                  )}
                  
                  {/* Selection Indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-2 right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Out of Stock Badge */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="px-3 py-1 bg-white text-foreground text-sm font-medium rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-display text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    {product.isOnSale && product.salePrice ? (
                      <>
                        <span className="text-xs text-foreground/40 line-through">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {formatPrice(product.salePrice)}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-foreground/80">
                        {formatPrice(displayPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-foreground/60">No combo products available at the moment.</p>
        </div>
      )}
    </div>
  );
}
