import Link from 'next/link';
import { Plus } from 'lucide-react';
import { fetchAllCategoryTree } from '@/app/lib/data';
import CategoryTree from '@/app/ui/admin/category-tree';

export default async function CategoriesPage() {
  const categories = await fetchAllCategoryTree();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-gray-600 mt-1">
            Manage your product categories and subcategories.
          </p>
        </div>
        <Link
          href="/admin/categories/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add Category
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <div className="text-sm text-gray-500">
            Drag the <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-200 rounded text-xs font-medium">⋮⋮</span> handle to reorder categories. Categories are sorted within their level.
          </div>
        </div>
        <div className="p-4">
          <CategoryTree categories={categories} />
        </div>
      </div>
    </div>
  );
}
