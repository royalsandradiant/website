'use client';

import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Mail, MapPin, Loader2 } from 'lucide-react';
import { useCart } from '@/app/lib/cart-context';
import { useEffect, useState, Suspense } from 'react';
import { motion } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import { getOrderBySessionId } from '@/app/lib/actions';

type OrderDetails = {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  items: { name: string; quantity: number; price: number }[];
  shippingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
};

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Clear cart on mount (only once)
  useEffect(() => {
    clearCart();
    // Clear localStorage explicitly as a backup
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
    }
  }, [clearCart]);

  // Fetch order details
  useEffect(() => {
    async function fetchOrder() {
      if (sessionId) {
        try {
          const orderData = await getOrderBySessionId(sessionId);
          setOrder(orderData);
        } catch (error) {
          console.error('Failed to fetch order:', error);
        }
      }
      setLoading(false);
    }
    
    fetchOrder();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          {/* Success Header */}
          <div className="text-center mb-10">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-8 w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
            >
              <CheckCircle className="h-12 w-12 text-green-600" />
            </motion.div>

            {/* Heading */}
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              Thank You!
            </h1>
            <p className="text-lg text-foreground/70">
              Your order has been placed successfully.
            </p>
          </div>

          {/* Order Details Card */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : order ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-secondary/30 border border-border rounded-lg overflow-hidden mb-8"
            >
              {/* Order Number Banner */}
              <div className="bg-primary/10 border-b border-border px-6 py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-foreground/60 uppercase tracking-wider mb-1">Order Number</p>
                    <p className="font-mono text-lg font-semibold text-primary">{order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-foreground/60 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-xl font-semibold text-foreground">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Items Ordered
                  </h3>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="text-foreground">{item.name}</p>
                          <p className="text-sm text-foreground/60">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Confirmation Notice */}
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">Confirmation Email Sent</p>
                    <p className="text-sm text-green-700">A confirmation email with your order details has been sent to <strong>{order.customerEmail}</strong></p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping To
                  </h3>
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="font-medium text-foreground">{order.customerName}</p>
                    <p className="text-foreground/70">{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && (
                      <p className="text-foreground/70">{order.shippingAddress.line2}</p>
                    )}
                    <p className="text-foreground/70">
                      {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                    </p>
                    <p className="text-foreground/70">{order.shippingAddress.country}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Fallback when order details not available */
            <div className="bg-secondary/30 border border-border rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Mail className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Check Your Email</span>
              </div>
              <p className="text-center text-foreground/70 mb-4">
                We&apos;ve sent a confirmation email with your order number and details.
              </p>
            </div>
          )}

          {/* What's Next Card */}
          <div className="bg-secondary/30 border border-border rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">What&apos;s Next?</span>
            </div>
            <ul className="text-sm text-foreground/60 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>You&apos;ll receive an order confirmation email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>We&apos;ll notify you when your order ships</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Tracking information will be included in the shipping email</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background pt-28 pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
