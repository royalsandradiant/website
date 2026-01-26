import { fetchComboProducts, fetchComboSettings } from '@/app/lib/data';
import ComboSelector from '@/app/ui/combo-selector';
import Link from 'next/link';
import type { ProductWithCategory } from '@/app/lib/definitions';

export const metadata = {
  title: 'Combo Deals | Royals and Radiant',
  description: 'Pick any 3 items from our curated combo collection and save! Exclusive bundle deals on jewelry.',
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
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto mb-6">
            Choose any <span className="font-semibold text-foreground">3 items</span> from our 
            curated selection and get them all for just{' '}
            <span className="font-bold text-primary text-xl">
              ${settings.comboPrice.toFixed(2)}
            </span>
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <span className="text-foreground/70">Select 3 items</span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <span className="text-foreground/70">Add to cart</span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <span className="text-foreground/70">Checkout & Save!</span>
            </div>
          </div>
        </div>

        {/* Combo Selector */}
        {validProducts.length > 0 ? (
          <ComboSelector products={validProducts} comboPrice={settings.comboPrice} />
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
