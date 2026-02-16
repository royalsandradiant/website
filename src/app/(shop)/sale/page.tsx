import { fetchSaleProducts } from '@/app/lib/data';
import type { ProductWithCategory } from '@/app/lib/definitions';
import { ProductGrid } from '@/app/ui/product-grid';
import { ProductSort } from '@/app/ui/product-sort';

export default async function SalePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams;
  const products = await fetchSaleProducts(category);
  const validProducts = products.filter((p): p is ProductWithCategory => p !== null);

  // Sorting logic
  const sortedProducts = [...validProducts];
  if (sort === 'price-asc') {
    sortedProducts.sort((a, b) => {
      const priceA = a.isOnSale && a.salePrice ? a.salePrice : a.price;
      const priceB = b.isOnSale && b.salePrice ? b.salePrice : b.price;
      return priceA - priceB;
    });
  } else if (sort === 'price-desc') {
    sortedProducts.sort((a, b) => {
      const priceA = a.isOnSale && a.salePrice ? a.salePrice : a.price;
      const priceB = b.isOnSale && b.salePrice ? b.salePrice : b.price;
      return priceB - priceA;
    });
  } else if (sort === 'featured') {
    sortedProducts.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-8 mb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block px-4 py-1 bg-primary/10 rounded-full mb-6">
            <span className="text-sm font-medium tracking-widest text-primary uppercase">
              Limited Time
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl text-foreground mb-6 capitalize">
            {category ? `${category} Sale` : 'Sale'}
          </h1>
          <p className="text-lg text-foreground/70 leading-relaxed">
            {category 
              ? `Discover exceptional ${category.toLowerCase()} at extraordinary prices. Our curated collection features timeless designs with savings you won't want to miss.`
              : "Discover exceptional pieces at extraordinary prices. Our curated sale collection features timeless designs with savings you won't want to miss."
            }
          </p>
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="container mx-auto px-4 md:px-8 mb-16">
        <div className="flex items-center justify-center gap-4">
          <span className="h-px w-16 bg-primary/30"></span>
          <span className="text-primary text-2xl">✦</span>
          <span className="h-px w-16 bg-primary/30"></span>
        </div>
      </div>

      {/* Results count and Sort */}
      <div className="container mx-auto px-4 md:px-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <p className="text-sm text-foreground/60">
          {validProducts.length} {validProducts.length === 1 ? 'product' : 'products'} found
        </p>
        <ProductSort />
      </div>

      {/* Products Grid */}
      <section className="container mx-auto px-4 md:px-8">
        {sortedProducts.length > 0 ? (
          <ProductGrid products={sortedProducts} />
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-foreground/40 italic mb-4">
              No sale items at the moment.
            </p>
            <p className="text-foreground/50">
              Check back soon for exciting deals!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
