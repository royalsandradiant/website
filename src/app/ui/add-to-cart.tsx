"use client";

import { useCart } from "@/app/lib/cart-context";
import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { Product } from "@/app/lib/definitions";

export default function AddToCart({ product, onVariantChange }: { product: Product, onVariantChange?: (variant: any) => void }) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");

  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);
    // Reset size if the new variant doesn't support the currently selected size
    if (variant.sizes && variant.sizes.length > 0 && !variant.sizes.includes(selectedSize)) {
      setSelectedSize("");
    }
    if (onVariantChange) {
      onVariantChange(variant);
    }
  };

  const handleClearVariant = () => {
    setSelectedVariant(null);
    setSelectedSize("");
    if (onVariantChange) {
      onVariantChange(null);
    }
  };

  // Use sale price if product is on sale
  const basePrice =
    product.isOnSale && product.salePrice
      ? Number(product.salePrice)
      : Number(product.price);

  const effectivePrice = selectedVariant?.price ? Number(selectedVariant.price) : basePrice;

  const isOutOfStock = product.stock <= 0 && (!selectedVariant || selectedVariant.stock <= 0);

  const availableSizes = selectedVariant?.sizes?.length > 0 
    ? selectedVariant.sizes 
    : (product.sizes?.length > 0 ? product.sizes : []);

  const handleAddToCart = () => {
    // If sizes are available, one must be selected
    if (availableSizes.length > 0 && !selectedSize) {
      alert("Please select a size");
      return;
    }

    addItem({
      id: product.id,
      name: selectedVariant ? `${product.name} - ${selectedVariant.colorName}` : product.name,
      price: effectivePrice,
      quantity: quantity,
      imagePath: selectedVariant?.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : ''),
      color: selectedVariant?.colorName,
      size: selectedSize || undefined,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Variant Selector (Feature 3) */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-3">
          <span className="text-sm font-bold uppercase tracking-widest text-foreground/60">
            Available Colors:
          </span>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => handleVariantSelect(variant)}
                className={`group relative flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                  selectedVariant?.id === variant.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}
              >
                {variant.imageUrl ? (
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-border">
                    <img src={variant.imageUrl} alt={variant.colorName} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div 
                    className="h-12 w-12 rounded-full border border-border" 
                    style={{ backgroundColor: variant.hexCode || '#ccc' }}
                  />
                )}
                <span className="text-[10px] font-bold uppercase">{variant.colorName}</span>
                {variant.price && (
                  <span className="text-[10px] text-primary font-bold">${Number(variant.price).toFixed(2)}</span>
                )}
              </button>
            ))}
          </div>
          {selectedVariant && (
            <button 
              type="button" 
              onClick={handleClearVariant}
              className="text-xs text-foreground/40 hover:text-foreground underline"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* Size Selector */}
      {availableSizes.length > 0 && (
        <div className="space-y-3">
          <span className="text-sm font-bold uppercase tracking-widest text-foreground/60">
            Select Size:
          </span>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size: string) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`min-w-[45px] h-[45px] flex items-center justify-center rounded-lg border-2 font-bold transition-all ${
                  selectedSize === size 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : 'border-border hover:border-primary/30 text-foreground'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-foreground/70">
          Quantity:
        </span>
        <div className="flex items-center border border-border rounded-lg tabular-nums">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 hover:bg-secondary transition-colors focus-visible:bg-secondary outline-none"
            disabled={isOutOfStock}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="px-4 py-2 min-w-[50px] text-center font-medium">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            className="px-4 py-2 hover:bg-secondary transition-colors focus-visible:bg-secondary outline-none"
            disabled={isOutOfStock || quantity >= product.stock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`w-full rounded-lg px-8 py-4 text-base font-semibold tracking-wide transition-all flex items-center justify-center gap-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none ${
          isOutOfStock
            ? "bg-foreground/10 text-foreground/40 cursor-not-allowed"
            : isAdded
            ? "bg-green-600 text-white"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {isOutOfStock ? (
          "Out of Stock"
        ) : (
          <>
            {isAdded ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
            <span>Add to Cart</span>
          </>
        )}
      </button>
    </div>
  );
}
