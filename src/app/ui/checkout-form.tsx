'use client';

import { useCart } from '@/app/lib/cart-context';
import { createStripeCheckoutSession } from '@/app/lib/actions';
import { useState } from 'react';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';

export default function CheckoutForm() {
  const { items, total } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-foreground/60">Your cart is empty.</p>
      </div>
    );
  }

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

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await createStripeCheckoutSession(
        items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imagePath: item.imagePath,
        })),
        formData
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
        <h2 className="mb-6 font-display text-2xl text-foreground">Shipping Address</h2>
        <div className="space-y-4">
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
                <span className="text-foreground/70">
                  {item.name} × {item.quantity}
                </span>
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
          <div className="flex justify-between text-sm mb-4">
            <span className="text-foreground/70">Shipping</span>
            <span className="text-foreground">Calculated at checkout</span>
          </div>

          {/* Total */}
          <div className="flex justify-between text-lg font-semibold mb-6 tabular-nums">
            <span className="text-foreground">Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>

          {/* Checkout Button */}
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
