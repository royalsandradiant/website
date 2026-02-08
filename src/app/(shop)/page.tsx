import { fetchFeaturedProducts, fetchCategoryTree, fetchHeroImages } from '@/app/lib/data';
import type { ProductWithCategory } from '@/app/lib/definitions';
import { Hero } from '@/app/ui/hero';
import { ProductGrid } from '@/app/ui/product-grid';
import Link from 'next/link';

export default async function HomePage() {
  const [products, categoryTree, heroImages] = await Promise.all([
    fetchFeaturedProducts(),
    fetchCategoryTree(),
    fetchHeroImages(),
  ]);
  const validProducts = products.filter((p): p is ProductWithCategory => p !== null);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Hero images={heroImages} />
      
      {/* Curator's Note / Divider */}
      <section className="container mx-auto px-8 pb-20 text-center">
         <span className="mb-4 block mx-auto h-12 w-[1px] bg-primary/30"></span>
         <p className="font-display text-3xl italic text-foreground/80 md:text-4xl lg:text-5xl max-w-4xl mx-auto leading-tight">
           &quot;Jewelry is not meant to be hidden. It is meant to be lived in, loved, and passed down.&quot;
         </p>
         <span className="mt-4 block mx-auto h-12 w-[1px] bg-primary/30"></span>
      </section>

      <section id="products" className="container mx-auto px-4 md:px-8">
        <div className="mb-16 flex flex-col items-center justify-center text-center">
          <h2 className="font-display text-4xl text-foreground md:text-5xl">
            Our Featured Collection
          </h2>
          <p className="mt-4 max-w-md font-sans text-sm tracking-widest text-foreground/60 uppercase">
            Royals and Radiant — Timeless Elegance
          </p>
        </div>

        <ProductGrid products={validProducts} />
        
        {validProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-2xl text-foreground/40 italic mb-4">
              Our collection is being curated.
            </p>
            <p className="text-foreground/50">
              Check back soon for beautiful pieces!
            </p>
          </div>
        )}
      </section>

      {/* Categories Preview */}
      {categoryTree.length > 0 && (
        <section className="container mx-auto px-4 md:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4 text-balance">
              Shop by Category
            </h2>
            <p className="text-foreground/60">
              Explore our carefully curated collections
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {categoryTree.map((category) => (
              <Link
                key={category.id}
                href={`/products/category/${category.slugPath}`}
                className="group p-6 bg-secondary/80 rounded-lg text-center hover:bg-secondary transition-colors border border-border/50 min-w-[200px] flex-1 sm:flex-none sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1rem)]"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <span className="text-primary text-lg">✦</span>
                </div>
                <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors tracking-wide">
                  {category.name.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
