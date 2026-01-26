'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { createProduct, updateProduct } from '@/app/lib/actions';
import type { Product, ProductWithCategory, LeafCategory } from '@/app/lib/definitions';

interface ProductFormProps {
  product?: ProductWithCategory | null;
  categories: LeafCategory[];
}

export default function ProductForm({ product, categories }: ProductFormProps) {
  const initialState = { message: '', errors: {} };
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, dispatch] = useActionState(action, initialState);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.categoryId || '');
  const [isOnSale, setIsOnSale] = useState(product?.isOnSale || false);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured || false);
  const [isCombo, setIsCombo] = useState(product?.isCombo || false);
  const [currentImages, setCurrentImages] = useState<string[]>(product?.images || []);

  const removeCurrentImage = (url: string) => {
    setCurrentImages(currentImages.filter(img => img !== url));
  };

  return (
    <form action={dispatch} className="space-y-6">
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Product Name */}
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={product?.name}
            placeholder="Enter product name"
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

        {/* Category */}
        <div className="mb-4">
          <label htmlFor="categoryId" className="mb-2 block text-sm font-medium">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-4 text-sm outline-2"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.fullPath}
              </option>
            ))}
          </select>
          <div id="categoryId-error" aria-live="polite" aria-atomic="true">
            {state.errors?.categoryId?.map((error: string) => (
                <p key={error} className="mt-2 text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <label htmlFor="price" className="mb-2 block text-sm font-medium">
            Price ($) <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            defaultValue={product?.price}
            placeholder="Enter price"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-4 text-sm outline-2 placeholder:text-gray-500"
          />
           <div id="price-error" aria-live="polite" aria-atomic="true">
            {state.errors?.price?.map((error: string) => (
                <p key={error} className="mt-2 text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Featured Section */}
        <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-lg bg-white">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium">
              Featured Product
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500 ml-7">
            Featured products are displayed on the front page
          </p>
        </div>

        {/* Sale Section */}
        <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-lg bg-white">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="isOnSale"
              name="isOnSale"
              checked={isOnSale}
              onChange={(e) => setIsOnSale(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isOnSale" className="text-sm font-medium">
              This product is on sale
            </label>
          </div>
          
          {isOnSale && (
            <div>
              <label htmlFor="salePrice" className="mb-2 block text-sm font-medium">
                Sale Price ($)
              </label>
              <input
                id="salePrice"
                name="salePrice"
                type="number"
                step="0.01"
                defaultValue={product?.salePrice || ''}
                placeholder="Enter sale price"
                className="peer block w-full rounded-md border border-gray-200 py-2 px-4 text-sm outline-2 placeholder:text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                The sale price will be displayed instead of the regular price
              </p>
            </div>
          )}
        </div>

        {/* Combo Section */}
        <div className="mb-4 p-4 border border-dashed border-purple-300 rounded-lg bg-white">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCombo"
              name="isCombo"
              checked={isCombo}
              onChange={(e) => setIsCombo(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="isCombo" className="text-sm font-medium">
              Show on Combo Page
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500 ml-7">
            Products marked for combo will appear on the Combos page where customers can select 3 items for a bundle deal
          </p>
        </div>

        {/* Stock */}
        <div className="mb-4">
          <label htmlFor="stock" className="mb-2 block text-sm font-medium">
            Stock <span className="text-red-500">*</span>
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            defaultValue={product?.stock}
            placeholder="Enter stock quantity"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-4 text-sm outline-2 placeholder:text-gray-500"
          />
           <div id="stock-error" aria-live="polite" aria-atomic="true">
            {state.errors?.stock?.map((error: string) => (
                <p key={error} className="mt-2 text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={product?.description}
            placeholder="Enter description"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-4 text-sm outline-2 placeholder:text-gray-500"
            rows={4}
          />
           <div id="description-error" aria-live="polite" aria-atomic="true">
            {state.errors?.description?.map((error: string) => (
                <p key={error} className="mt-2 text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Images */}
        <div className="mb-4">
          <label htmlFor="images" className="mb-2 block text-sm font-medium">
            Product Images {!product && <span className="text-red-500">*</span>}
          </label>
          <input
            id="images"
            name="images"
            type="file"
            accept="image/*"
            multiple
            className="peer block w-full rounded-md border border-gray-200 py-2 px-4 text-sm outline-2 placeholder:text-gray-500"
          />
          {currentImages.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Existing images ({currentImages.length}):</p>
                <div className="flex flex-wrap gap-3">
                  {currentImages.map((img, i) => (
                    <div key={i} className="relative group h-20 w-20 overflow-hidden rounded-md border border-gray-200 shadow-sm">
                      <img src={img} alt={`Product ${i}`} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      <button
                        type="button"
                        onClick={() => removeCurrentImage(img)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                      <input type="hidden" name="existingImages" value={img} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 italic mt-1">Note: Images are only removed when you click &quot;Update Product&quot;</p>
              </div>
          )}
          <p className="mt-2 text-xs text-gray-400">Select multiple images to add more</p>
        </div>

        {/* Global Error Message */}
         <div id="form-error" aria-live="polite" aria-atomic="true">
            {state.message && (
                <p className="mt-2 text-sm text-red-500">{state.message}</p>
            )}
          </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/admin"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="flex h-10 items-center rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:bg-blue-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
