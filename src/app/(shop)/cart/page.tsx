'use client';

import { useCart, type CartItem } from '@/app/lib/cart-context';
import Link from 'next/link';
import Image from 'next/image';
import { TrashIcon, PlusIcon, MinusIcon, Package } from 'lucide-react';
import { useMemo } from 'react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();

  // Group items by comboId
  const { comboGroups, regularItems } = useMemo(() => {
    const combos: Record<string, CartItem[]> = {};
    const regular: CartItem[] = [];

    items.forEach(item => {
      if (item.comboId) {
        if (!combos[item.comboId]) {
          combos[item.comboId] = [];
        }
        combos[item.comboId].push(item);
      } else {
        regular.push(item);
      }
    });

    return { comboGroups: Object.entries(combos), regularItems: regular };
  }, [items]);

  const removeCombo = (comboId: string) => {
    items.forEach(item => {
      if (item.comboId === comboId) {
        removeItem(item.id, item.color, item.size);
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 font-display text-3xl text-foreground">Your Cart is Empty</h1>
        <p className="mb-8 text-foreground/60 max-w-md">Looks like you haven't added anything to your cart yet. Discover our latest collections and find something special.</p>
        <Link
          href="/"
          className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all tracking-widest uppercase"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 font-display text-3xl md:text-4xl text-foreground">Shopping Cart</h1>
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Combo Groups */}
          {comboGroups.map(([comboId, comboItems]) => {
            const comboTotal = comboItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            return (
              <div
                key={comboId}
                className="mb-6 rounded-xl border-2 border-primary/20 bg-primary/5 overflow-hidden"
              >
                {/* Combo Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-primary/20">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Combo Deal</span>
                    <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                      {comboItems.length} items
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-primary">${comboTotal.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => removeCombo(comboId)}
                      className="text-red-500 hover:text-red-600 transition-colors p-1"
                      title="Remove combo"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Combo Items */}
                <div className="divide-y divide-primary/10">
                  {comboItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4"
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                        {item.imagePath && (
                          <Image
                            src={item.imagePath}
                            alt={item.name}
                            fill
                            className="object-cover object-center"
                            sizes="64px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-sm text-foreground truncate">
                          {item.name.replace(/ \(Combo \d\/\d\)$/, '')}
                        </h3>
                        <p className="text-xs text-foreground/50">Part of combo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Regular Items */}
          {regularItems.map((item) => (
            <div
              key={item.id}
              className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 rounded-lg border border-border p-4 bg-card"
            >
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                {item.imagePath && (
                    <Image
                        src={item.imagePath}
                        alt={item.name}
                        fill
                        className="object-cover object-center"
                        sizes="96px"
                    />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg text-foreground truncate">{item.name}</h3>
                {item.size && (
                  <p className="text-xs text-foreground/50 font-bold uppercase">Size: {item.size}</p>
                )}
                <p className="font-sans text-primary font-medium">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.color, item.size)}
                    className="rounded-full bg-secondary p-1.5 hover:bg-secondary/80 transition-colors"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.color, item.size)}
                    className="rounded-full bg-secondary p-1.5 hover:bg-secondary/80 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id, item.color, item.size)}
                  className="text-red-500 hover:text-red-600 transition-colors p-1"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="h-fit rounded-lg border border-border bg-secondary/30 p-6">
          <h2 className="mb-6 font-display text-2xl text-foreground">Order Summary</h2>
          
          {/* Show combo summary if there are combos */}
          {comboGroups.length > 0 && (
            <div className="mb-4 pb-4 border-b border-border">
              {comboGroups.map(([comboId, comboItems]) => {
                const comboTotal = comboItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
                return (
                  <div key={comboId} className="flex justify-between text-sm mb-2">
                    <span className="text-foreground/70">Combo Deal ({comboItems.length} items)</span>
                    <span className="text-primary font-medium">${comboTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Regular items subtotal */}
          {regularItems.length > 0 && (
            <div className="mb-4 pb-4 border-b border-border">
              {regularItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm mb-2">
                  <div className="flex flex-col truncate max-w-[60%]">
                    <span className="text-foreground/70 truncate">{item.name} x{item.quantity}</span>
                    {item.size && (
                      <span className="text-[10px] text-foreground/40 font-bold uppercase">Size: {item.size}</span>
                    )}
                  </div>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="mb-6 flex justify-between text-lg font-semibold border-t border-border pt-4">
            <span className="text-foreground/70">Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            className="block w-full rounded-lg bg-primary py-4 text-center font-semibold text-primary-foreground hover:bg-primary/90 transition-all tracking-wide"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}


