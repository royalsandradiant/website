import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchCategoryBySlugPath, fetchProductsByCategoryPath, fetchCategoryTree } from '@/app/lib/data';
import { ProductGrid } from '@/app/ui/product-grid';
import { buildBreadcrumbFromPath } from '@/app/lib/category';

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const slugPath = slug.join('/');
  
  const [category, products, categoryTree] = await Promise.all([
    fetchCategoryBySlugPath(slugPath),
    fetchProductsByCategoryPath(slugPath),
    fetchCategoryTree(),
  ]);

  if (!category) {
    notFound();
  }

  const breadcrumb = buildBreadcrumbFromPath(categoryTree, slugPath);

  return (
    <div className="min-h-screen bg-background pt-36 pb-20">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 md:px-8 mb-8">
        <nav className="text-sm">
          <ol className="flex items-center gap-2 text-foreground/50">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            {breadcrumb.map((crumb, index) => (
              <li key={crumb.id} className="flex items-center gap-2">
                <span>/</span>
                {index === breadcrumb.length - 1 ? (
                  <span className="text-foreground">{crumb.name}</span>
                ) : (
                  <Link
                    href={`/products/category/${crumb.slugPath}`}
                    className="hover:text-primary transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-8 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4 text-balance">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-base text-foreground/70 leading-relaxed text-pretty">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* Subcategory Filter */}
      {category.children && category.children.length > 0 && (
        <section className="container mx-auto px-4 md:px-8 mb-12">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            <Link
              href={`/products/category/${category.slugPath}`}
              className="px-4 md:px-6 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground"
            >
              All {category.name}
            </Link>
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/products/category/${child.slugPath}`}
                className="px-4 md:px-6 py-2 rounded-full text-sm font-medium bg-secondary text-foreground hover:bg-primary/10 transition-all"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Results count */}
      <div className="container mx-auto px-4 md:px-8 mb-8">
        <p className="text-sm text-foreground/60">
          {products.length} {products.length === 1 ? 'product' : 'products'} found
        </p>
      </div>

      {/* Products Grid */}
      <section className="container mx-auto px-4 md:px-8">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-foreground/40 italic mb-4">
              No products found yet.
            </p>
            <p className="text-foreground/50 mb-6">
              Check back soon for new arrivals!
            </p>
            {category.parentId && (
              <Link
                href={`/products/category/${slugPath.split('/').slice(0, -1).join('/')}`}
                className="text-primary hover:underline"
              >
                ← Browse parent category
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
