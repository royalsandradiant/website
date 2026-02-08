import CheckoutForm from '@/app/ui/checkout-form';
import { fetchShippingRules, fetchComboSettings } from '@/app/lib/data';

export default async function CheckoutPage() {
  const shippingRules = await fetchShippingRules();
  const settings = await fetchComboSettings();
  
  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">Checkout</h1>
          <p className="text-foreground/60">Complete your order securely</p>
        </div>
        <CheckoutForm 
          shippingRules={shippingRules} 
          allowPickup={settings.allowStorePickup}
          pickupAddress={settings.pickupAddress}
        />
      </div>
    </div>
  );
}


