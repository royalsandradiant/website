import { fetchComboProducts, fetchComboSettings } from '@/app/lib/data';
import ComboSelector from '@/app/ui/combo-selector';
import Link from 'next/link';
import type { ProductWithCategory } from '@/app/lib/definitions';

export const metadata = {
  title: 'Combo Deals | Royals and Radiant',
  description: 'Pick any 2 or 3 items from our curated combo collection and get an exclusive bundle discount!',
};

export default async function CombosPage() {
  const [products, settings] = await Promise.all([
    fetchComboProducts(),
    fetchComboSettings(),
  ]);

  const validProducts = products.filter((p): p is ProductWithCategory => p !== null);

  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
      <div className="container mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <ol className="flex items-center gap-2 text-foreground/50">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">Combos</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase rounded-full mb-4">
            Exclusive Offer
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
            Combo Deals
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
            <div className="bg-secondary/50 p-4 rounded-xl border border-border">
              <p className="text-sm text-foreground/50 uppercase tracking-widest mb-1">Buy 2 Get</p>
              <p className="text-3xl font-bold text-primary">{settings.comboDiscount2}% OFF</p>
            </div>
            <div className="bg-secondary/50 p-4 rounded-xl border border-border">
              <p className="text-sm text-foreground/50 uppercase tracking-widest mb-1">Buy 3 Get</p>
              <p className="text-3xl font-bold text-primary">{settings.comboDiscount3}% OFF</p>
            </div>
          </div>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto mb-6">
            Pick any <span className="font-semibold text-foreground">2 or 3 items</span> from our 
            curated selection and save with our special bundle discounts!
          </p>
        </div>

        {/* Combo Selector */}
        {validProducts.length > 0 ? (
          <ComboSelector 
            products={validProducts} 
            comboDiscount2={settings.comboDiscount2} 
            comboDiscount3={settings.comboDiscount3} 
          />
        ) : (
          <div className="text-center py-20 bg-secondary/30 rounded-2xl border border-dashed border-border">
            <h2 className="font-display text-2xl text-foreground mb-2">No Combos Available</h2>
            <p className="text-foreground/60">
              Check back soon for our latest curated combo deals!
            </p>
            <Link 
              href="/" 
              className="inline-block mt-6 text-primary font-medium hover:underline"
            >
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
