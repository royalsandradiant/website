'use client';

import { useCart } from '@/app/lib/cart-context';
import { createStripeCheckoutSession, validateCoupon } from '@/app/lib/actions';
import { useState, useMemo } from 'react';
import { Loader2, CreditCard, ShieldCheck, Tag, X, MapPin, Truck } from 'lucide-react';
import type { ShippingRule } from '@/app/lib/definitions';

export default function CheckoutForm({ 
  shippingRules,
  allowPickup = false,
  pickupAddress = ''
}: { 
  shippingRules: ShippingRule[],
  allowPickup?: boolean,
  pickupAddress?: string | null
}) {
  const { items, total } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pickup State
  const [isPickup, setIsPickup] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: '',
  });

  // Calculate Discount
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      return (total * appliedCoupon.discountValue) / 100;
    }
    return appliedCoupon.discountValue;
  }, [total, appliedCoupon]);

  const subtotalAfterDiscount = Math.max(0, total - discountAmount);

  // Calculate Shipping (Feature 4 & 5)
  const shippingCost = useMemo(() => {
    if (isPickup) return 0;
    if (shippingRules.length === 0) return 0;
    const rule = shippingRules.find(r => 
      subtotalAfterDiscount >= Number(r.minAmount) && 
      (r.maxAmount === null || subtotalAfterDiscount <= Number(r.maxAmount))
    );
    return rule ? Number(rule.price) : 0;
  }, [subtotalAfterDiscount, shippingRules, isPickup]);

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-foreground/60">Your cart is empty.</p>
      </div>
    );
  }

  const finalTotal = subtotalAfterDiscount + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const requiredFields: (keyof typeof formData)[] = ['customerName', 'customerEmail', 'addressLine1', 'city', 'postalCode', 'country'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill in your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
        document.getElementById(field)?.focus();
        return false;
      }
    }
    
    if (!formData.customerEmail.includes('@')) {
      setError("Please enter a valid email address.");
      document.getElementById('customerEmail')?.focus();
      return false;
    }
    setError("");
    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    
    const result = await validateCoupon(couponCode, total);
    if (result.success && result.coupon) {
      setAppliedCoupon(result.coupon);
      setCouponCode('');
    } else {
      setCouponError(result.error || 'Invalid coupon code.');
    }
    setIsValidatingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleCheckout = async () => {
    if (!isPickup && !validateForm()) return;
    if (isPickup && (!formData.customerName || !formData.customerEmail)) {
      setError("Please fill in your name and email.");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await createStripeCheckoutSession(
        items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          images: item.imagePath ? [item.imagePath] : [],
          comboId: item.comboId,
          originalProductId: item.originalProductId,
          size: item.size,
        })),
        isPickup ? {
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          addressLine1: 'STORE PICKUP',
          city: 'PICKUP',
          postalCode: 'PICKUP',
          country: 'US',
        } : formData,
        shippingCost,
        appliedCoupon ? {
          code: appliedCoupon.code,
          discountAmount: discountAmount
        } : undefined,
        isPickup
      );

      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Shipping Address Form */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-foreground">Delivery Method</h2>
        </div>

        {allowPickup && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setIsPickup(false)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                !isPickup 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-border bg-transparent text-foreground/60 hover:border-foreground/20'
              }`}
            >
              <Truck className="h-6 w-6" />
              <span className="text-sm font-semibold">Shipping</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPickup(true)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                isPickup 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-border bg-transparent text-foreground/60 hover:border-foreground/20'
              }`}
            >
              <MapPin className="h-6 w-6" />
              <span className="text-sm font-semibold">Store Pickup</span>
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-foreground/70 mb-2">
                Full Name *
              </label>
              <input
                id="customerName"
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                placeholder="John Doe"
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-foreground/70 mb-2">
                Email *
              </label>
              <input
                id="customerEmail"
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                placeholder="john@example.com"
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>
          </div>

          {!isPickup ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="font-display text-xl text-foreground mt-6 mb-4">Shipping Address</h3>
              <div>
                <label htmlFor="addressLine1" className="block text-sm font-medium text-foreground/70 mb-2">
                  Address Line 1 *
                </label>
                <input
                  id="addressLine1"
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                  placeholder="123 Main Street"
                  required
                  autoComplete="address-line1"
                />
              </div>
              <div>
                <label htmlFor="addressLine2" className="block text-sm font-medium text-foreground/70 mb-2">
                  Address Line 2 (Optional)
                </label>
                <input
                  id="addressLine2"
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                  placeholder="Apt 4B"
                  autoComplete="address-line2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-foreground/70 mb-2">
                    City *
                  </label>
                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                    placeholder="New York"
                    required
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-foreground/70 mb-2">
                    Postal Code *
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                    placeholder="10001"
                    required
                    autoComplete="postal-code"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-foreground/70 mb-2">
                  Country *
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                  required
                  autoComplete="country"
                >
                  <option value="">Select a country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-6 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-primary mb-1">Pickup Location</h3>
                  <p className="text-sm text-foreground/70 whitespace-pre-line">
                    {pickupAddress || 'Address not configured.'}
                  </p>
                  <p className="text-xs text-primary/60 mt-4 italic">
                    * Please bring your order confirmation and a valid ID when picking up.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Order Summary & Payment */}
      <div>
        <h2 className="mb-6 font-display text-2xl text-foreground">Order Summary</h2>
        <div className="rounded-lg bg-secondary/30 border border-border p-6">
          {/* Order Items */}
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm tabular-nums">
                <div className="flex flex-col">
                  <span className="text-foreground/70">
                    {item.name} × {item.quantity}
                  </span>
                  {item.size && (
                    <span className="text-[10px] text-foreground/40 font-bold uppercase">
                      Size: {item.size}
                    </span>
                  )}
                </div>
                <span className="font-medium text-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border my-4" />

          {/* Subtotal */}
          <div className="flex justify-between text-sm mb-2 tabular-nums">
            <span className="text-foreground/70">Subtotal</span>
            <span className="text-foreground">${total.toFixed(2)}</span>
          </div>

          {/* Coupon Section */}
          <div className="mt-4 mb-4">
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon Code"
                    className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponCode}
                  className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                >
                  {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{appliedCoupon.code}</span>
                  <span className="text-xs text-primary/70">
                    ({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}%` : `$${appliedCoupon.discountValue}`} off)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-primary hover:text-primary/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {couponError && <p className="mt-1 text-xs text-red-500">{couponError}</p>}
          </div>

          {appliedCoupon && (
            <div className="flex justify-between text-sm mb-2 tabular-nums">
              <span className="text-foreground/70">Discount</span>
              <span className="text-primary">-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm mb-4 tabular-nums">
            <span className="text-foreground/70">Shipping</span>
            <span className={shippingCost === 0 ? "text-green-600 font-bold" : "text-foreground"}>
              {shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
            </span>
          </div>

          {/* Total */}
          <div className="flex justify-between text-lg font-semibold mb-6 tabular-nums">
            <span className="text-foreground">Total</span>
            <span className="text-primary">${finalTotal.toFixed(2)}</span>
          </div>

          {/* Checkout Button */}
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest text-center">
              All sales are final • No returns or exchanges
            </p>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full py-4 bg-primary text-primary-foreground font-semibold tracking-wide rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
            aria-busy={isLoading}
          >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            <CreditCard className={`h-5 w-5 ${isLoading ? 'hidden' : ''}`} />
            <span>Proceed to Payment</span>
          </button>

          {/* Security Badge */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground/50">
            <ShieldCheck className="h-4 w-4" />
            <span>Secured by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
