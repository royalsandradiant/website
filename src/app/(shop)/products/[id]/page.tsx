import { fetchProductById, fetchCategoryTree } from '@/app/lib/data';
import { buildBreadcrumbFromPath } from '@/app/lib/category';
import { notFound } from 'next/navigation';
import AddToCart from '@/app/ui/add-to-cart';
import Link from 'next/link';
import ImageGallery from '@/app/ui/image-gallery';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categoryTree] = await Promise.all([
    fetchProductById(id),
    fetchCategoryTree(),
  ]);

  if (!product) {
    notFound();
  }

  const isOnSale = product.isOnSale && product.salePrice;
  const displayPrice = isOnSale ? Number(product.salePrice) : Number(product.price);
  const originalPrice = Number(product.price);
  
  // Calculate sale percentage
  const salePercentage = isOnSale 
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) 
    : 0;

  // Get category breadcrumb
  const categoryBreadcrumb = product.categoryRef 
    ? buildBreadcrumbFromPath(categoryTree, product.categoryRef.slugPath)
    : [];

  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
      <div className="container mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <ol className="flex items-center gap-2 text-foreground/50">
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

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Product Image Gallery */}
          <div className="relative">
            {/* Sale Badge */}
            {isOnSale && (
              <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold tracking-wide rounded-full">
                {salePercentage}% OFF
              </div>
            )}
            
            <ImageGallery images={product.images} name={product.name} />
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-center">
            {product.categoryRef && (
              <div className="mb-2">
                <span className="text-sm font-medium tracking-widest text-primary uppercase">
                  {categoryBreadcrumb.map(c => c.name).join(' • ')}
                </span>
              </div>
            )}
            
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-6">
              {product.name}
            </h1>
            
            {/* Price */}
            <div className="mb-8">
              {isOnSale ? (
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-medium text-foreground/40 line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                  <span className="text-3xl font-bold text-primary">
                    ${displayPrice.toFixed(2)}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    Save ${(originalPrice - displayPrice).toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-foreground">
                  ${displayPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <p className="text-foreground/70 leading-relaxed text-lg">
                {product.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="mb-8 p-6 bg-secondary/50 rounded-lg space-y-3">
              {product.categoryRef && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Category</span>
                  <Link 
                    href={`/products/category/${product.categoryRef.slugPath}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {categoryBreadcrumb.map(c => c.name).join(' > ')}
                  </Link>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">Availability</span>
                <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>
            </div>

            <AddToCart product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}


