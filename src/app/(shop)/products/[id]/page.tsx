import { fetchProductById, fetchCategoryTree, fetchComboSettings } from '@/app/lib/data';
import { buildBreadcrumbFromPath } from '@/app/lib/category';
import { notFound } from 'next/navigation';
import ProductDetails from '@/app/ui/product-details';
import Link from 'next/link';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categoryTree, settings] = await Promise.all([
    fetchProductById(id),
    fetchCategoryTree(),
    fetchComboSettings(),
  ]);

  if (!product) {
    notFound();
  }

  // Get category breadcrumb
  const categoryBreadcrumb = product.categoryRef 
    ? buildBreadcrumbFromPath(categoryTree, product.categoryRef.slugPath)
    : [];

  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
      <div className="container mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <ol className="flex flex-wrap items-center gap-2 text-foreground/50">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            {categoryBreadcrumb.map((cat) => (
              <li key={cat.id} className="flex items-center gap-2">
                <span>/</span>
                <Link 
                  href={`/products/category/${cat.slugPath}`} 
                  className="hover:text-primary transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>/</li>
            <li className="text-foreground">{product.name}</li>
          </ol>
        </nav>

        <ProductDetails product={product} categoryBreadcrumb={categoryBreadcrumb} settings={settings} />
      </div>
    </div>
  );
}


