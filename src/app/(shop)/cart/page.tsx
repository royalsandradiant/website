'use client';

import { useCart } from '@/app/lib/cart-context';
import Link from 'next/link';
import Image from 'next/image';
import { TrashIcon, PlusIcon, MinusIcon } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();

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
          {items.map((item) => (
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
                <p className="font-sans text-primary font-medium">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="rounded-full bg-secondary p-1.5 hover:bg-secondary/80 transition-colors"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="rounded-full bg-secondary p-1.5 hover:bg-secondary/80 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
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


