import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { fetchAllCategoriesFlat } from '@/app/lib/data';
import CategoryForm from '@/app/ui/admin/category-form';

interface CreateCategoryPageProps {
  searchParams: Promise<{ parent?: string }>;
}

export default async function CreateCategoryPage({ searchParams }: CreateCategoryPageProps) {
  const params = await searchParams;
  const allCategories = await fetchAllCategoriesFlat();
  const defaultParentId = params.parent || null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="size-4" />
          Back to Categories
        </Link>
        <h1 className="text-2xl font-semibold">Create Category</h1>
        <p className="text-gray-600 mt-1">
          Add a new category or subcategory to organize your products.
        </p>
      </div>

      <div className="max-w-2xl">
        <CategoryForm 
          allCategories={allCategories} 
          defaultParentId={defaultParentId}
        />
      </div>
    </div>
  );
}
