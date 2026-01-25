"use client";

import { useCart } from "@/app/lib/cart-context";
import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { Product } from "@/app/lib/definitions";

export default function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Use sale price if product is on sale
  const effectivePrice =
    product.isOnSale && product.salePrice
      ? Number(product.salePrice)
      : Number(product.price);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: effectivePrice,
      quantity: quantity,
      imagePath: product.images && product.images.length > 0 ? product.images[0] : '',
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="space-y-4">
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
