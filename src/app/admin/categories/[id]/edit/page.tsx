import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { fetchCategoryById, fetchAllCategoriesFlat } from '@/app/lib/data';
import CategoryForm from '@/app/ui/admin/category-form';

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const [category, allCategories] = await Promise.all([
    fetchCategoryById(id),
    fetchAllCategoriesFlat(),
  ]);

  if (!category) {
    notFound();
  }

  // Transform to match Category type
  const categoryData = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    slugPath: category.slugPath,
    description: category.description,
    imageUrl: category.imageUrl,
    isVisible: category.isVisible,
    sortOrder: category.sortOrder,
    parentId: category.parentId,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };

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
        <h1 className="text-2xl font-semibold">Edit Category</h1>
        <p className="text-gray-600 mt-1">
          Update "{category.name}" category details.
        </p>
      </div>

      <div className="max-w-2xl">
        <CategoryForm 
          category={categoryData} 
          allCategories={allCategories}
        />
      </div>
    </div>
  );
}
