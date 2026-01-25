import BulkProductForm from '@/app/ui/admin/bulk-product-form';
import { fetchAllCategoriesFlat } from '@/app/lib/data';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bulk Upload Products',
};

export default async function Page() {
  const categories = await fetchAllCategoriesFlat();

  return (
    <main className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Bulk Upload Products
        </h1>
        <p className="mt-2 text-gray-600">
          Upload multiple products at once. Drag and drop images, fill in the product details, and create them all with one click.
        </p>
      </div>
      <BulkProductForm categories={categories} />
    </main>
  );
}
