import { fetchProductById, fetchCategoryTree, fetchComboSettings } from '@/app/lib/data';
import { buildBreadcrumbFromPath } from '@/app/lib/category';
import { notFound } from 'next/navigation';
import AddToCart from '@/app/ui/add-to-cart';
import Link from 'next/link';
import ImageGallery from '@/app/ui/image-gallery';

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

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Product Image Gallery - Reduced size to align better with text (Amazon style) */}
          <div className="relative lg:col-span-5 xl:col-span-4">
            {/* Sale Badge */}
            {isOnSale && (
              <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold tracking-wide rounded-full shadow-lg">
                {salePercentage}% OFF
              </div>
            )}
            
            <ImageGallery images={product.images} name={product.name} variants={product.variants} />
          </div>

          {/* Product Details */}
          <div className="flex flex-col lg:col-span-7 xl:col-span-8">
            {product.categoryRef && (
              <div className="mb-2">
                <span className="text-sm font-medium tracking-widest text-primary uppercase">
                  {categoryBreadcrumb.map(c => c.name).join(' • ')}
                </span>
              </div>
            )}
            
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              {product.name}
            </h1>
            
            {/* Delivery Info (Feature 6) */}
            <div className="flex items-center gap-2 mb-6 text-sm text-foreground/60 bg-blue-50/50 p-3 rounded-lg border border-blue-100 max-w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              <span>Estimated delivery: <strong>{settings.estimatedDeliveryMin} to {settings.estimatedDeliveryMax} business days</strong></span>
            </div>
            
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
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20 shadow-sm">
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
            <div className="mb-8 border-t pt-8">
              <p className="text-foreground/70 leading-relaxed text-lg whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Product Meta Info */}
            <div className="mb-8 p-6 bg-secondary/30 rounded-xl space-y-4 border border-border/40">
              <div className="flex justify-between text-sm items-center pb-3 border-b border-border/40">
                <span className="text-foreground/60 uppercase tracking-tighter font-bold">Availability</span>
                <span className={`font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-foreground/60 uppercase tracking-tighter font-bold">Standard Shipping</span>
                <span className="text-foreground font-medium italic">Calculated at checkout</span>
              </div>
            </div>

            <AddToCart product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}


