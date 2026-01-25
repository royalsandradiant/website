'use client';

import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createCategory, updateCategory } from '@/app/lib/actions';
import type { Category, LeafCategory, CategoryState } from '@/app/lib/definitions';
import { slugify } from '@/app/lib/utils';

interface CategoryFormProps {
  category?: Category | null;
  allCategories: LeafCategory[];
  defaultParentId?: string | null;
}

export default function CategoryForm({ category, allCategories, defaultParentId }: CategoryFormProps) {
  const initialState: CategoryState = { message: '', errors: {} };
  const action = category 
    ? updateCategory.bind(null, category.id) 
    : createCategory;
  const [state, dispatch] = useActionState(action, initialState);
  
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [autoSlug, setAutoSlug] = useState(!category);
  const [isVisible, setIsVisible] = useState(category?.isVisible ?? true);
  const [currentImage, setCurrentImage] = useState<string | null>(category?.imageUrl || null);

  // Filter out the current category and its descendants from parent options
  const availableParents = allCategories.filter(c => {
    if (!category) return true;
    // Can't be its own parent
    if (c.id === category.id) return false;
    // Can't be a descendant of itself
    if (c.slugPath.startsWith(category.slugPath + '/')) return false;
    return true;
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && name) {
      setSlug(slugify(name));
    }
  }, [name, autoSlug]);

  return (
    <form action={dispatch} className="space-y-6">
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Dresses"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-4 text-sm outline-2 placeholder:text-gray-500"
            aria-describedby="name-error"
          />
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.name?.map((error: string) => (
              <p key={error} className="mt-2 text-sm text-red-500">
                {error}
              </p>
            ))}
          </div>
        </div>

        {/* Slug */}
        <div className="mb-4">
          <label htmlFor="slug" className="mb-2 block text-sm font-medium">
            URL Slug <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="slug"
              name="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              placeholder="e.g., dresses"
              className="peer block w-full rounded-md border border-gray-200 py-2 px-4 text-sm outline-2 placeholder:text-gray-500 font-mono"
              aria-describedby="slug-error"
            />
            {!category && (
              <button
                type="button"
                onClick={() => {
                  setAutoSlug(true);
                  setSlug(slugify(name));
                }}
                className="text-sm text-primary hover:underline whitespace-nowrap"
              >
                Auto-generate
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Used in URLs. Only lowercase letters, numbers, and hyphens.
          </p>
          <div id="slug-error" aria-live="polite" aria-atomic="true">
            {state.errors?.slug?.map((error: string) => (
              <p key={error} className="mt-2 text-sm text-red-500">
                {error}
              </p>
            ))}
          </div>
        </div>

        {/* Parent Category */}
        <div className="mb-4">
          <label htmlFor="parentId" className="mb-2 block text-sm font-medium">
            Parent Category
          </label>
          <select
            id="parentId"
            name="parentId"
            defaultValue={category?.parentId || defaultParentId || ''}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-4 text-sm outline-2"
          >
            <option value="">None (Top-level category)</option>
            {availableParents.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.fullPath}
              </option>
            ))}
          </select>
          <div id="parentId-error" aria-live="polite" aria-atomic="true">
            {state.errors?.parentId?.map((error: string) => (
              <p key={error} className="mt-2 text-sm text-red-500">
                {error}
              </p>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={category?.description || ''}
            rows={3}
            placeholder="Optional description shown on category pages"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-4 text-sm outline-2 placeholder:text-gray-500"
            aria-describedby="description-error"
          />
          <div id="description-error" aria-live="polite" aria-atomic="true">
            {state.errors?.description?.map((error: string) => (
              <p key={error} className="mt-2 text-sm text-red-500">
                {error}
              </p>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="mb-4">
          <label htmlFor="image" className="mb-2 block text-sm font-medium">
            Category Image
          </label>
          {currentImage && (
            <div className="mb-2 relative inline-block">
              <Image
                src={currentImage}
                alt="Current category image"
                width={120}
                height={120}
                className="rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => setCurrentImage(null)}
                className="absolute -top-2 -right-2 size-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          )}
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            className="peer block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional image displayed on category pages.
          </p>
        </div>

        {/* Sort Order */}
        <div className="mb-4">
          <label htmlFor="sortOrder" className="mb-2 block text-sm font-medium">
            Sort Order
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={category?.sortOrder || 0}
            min={0}
            className="peer block w-32 rounded-md border border-gray-200 py-2 px-4 text-sm outline-2"
            aria-describedby="sortOrder-error"
          />
          <p className="mt-1 text-xs text-gray-500">
            Lower numbers appear first. Categories with same order are sorted alphabetically.
          </p>
          <div id="sortOrder-error" aria-live="polite" aria-atomic="true">
            {state.errors?.sortOrder?.map((error: string) => (
              <p key={error} className="mt-2 text-sm text-red-500">
                {error}
              </p>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isVisible"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium">Visible on storefront</span>
          </label>
          <p className="mt-1 text-xs text-gray-500 ml-6">
            Hidden categories won't appear in navigation but products can still be assigned.
          </p>
        </div>
      </div>

      {/* Form Error */}
      {state.message && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {state.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href="/admin/categories"
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          {category ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}
