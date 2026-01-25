import ProductForm from '@/app/ui/admin/product-form';
import { fetchAllCategoriesFlat } from '@/app/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Product',
};

export default async function Page() {
  const categories = await fetchAllCategoriesFlat();

  return (
    <main>
      <h1 className="mb-4 text-xl md:text-2xl">
        Create Product
      </h1>
      <ProductForm categories={categories} />
    </main>
  );
}


