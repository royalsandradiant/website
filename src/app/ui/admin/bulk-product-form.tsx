'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { bulkCreateProducts } from '@/app/lib/actions';
import type { BulkProductResult } from '@/app/lib/actions';
import type { LeafCategory } from '@/app/lib/definitions';
import { PlusIcon, TrashIcon, UploadIcon, XIcon, CheckCircleIcon, XCircleIcon, ImageIcon } from 'lucide-react';

type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: string;
  categoryId: string;
  stock: string;
  isOnSale: boolean;
  isFeatured: boolean;
  salePrice: string;
  imageFileNames: string[];
};

const createEmptyProduct = (): ProductRow => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
  price: '',
  categoryId: '',
  stock: '10',
  isOnSale: false,
  isFeatured: false,
  salePrice: '',
  imageFileNames: [],
});

interface BulkProductFormProps {
  categories: LeafCategory[];
}

export default function BulkProductForm({ categories }: BulkProductFormProps) {
  const [products, setProducts] = useState<ProductRow[]>([createEmptyProduct()]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<BulkProductResult[] | null>(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addProductRow = () => {
    setProducts([...products, createEmptyProduct()]);
  };

  const removeProductRow = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof ProductRow, value: string | boolean | string[]) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value } as ProductRow;
      }
      return p;
    }));
  };

  const toggleImageSelection = (productId: string, fileName: string) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        const current = p.imageFileNames;
        const updated = current.includes(fileName)
          ? current.filter(name => name !== fileName)
          : [...current, fileName];
        return { ...p, imageFileNames: updated };
      }
      return p;
    }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    setUploadedImages(prev => [...prev, ...files]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setUploadedImages(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const isProductValid = (p: ProductRow) => {
    const hasRequiredFields = p.name && p.description && p.price && p.categoryId && p.imageFileNames.length > 0;
    const hasSalePriceIfOnSale = !p.isOnSale || (p.isOnSale && p.salePrice);
    return hasRequiredFields && hasSalePriceIfOnSale;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResults(null);
    setMessage('');

    // Validate products
    const invalidProducts = products.filter(p => !isProductValid(p));
    if (invalidProducts.length > 0) {
      setMessage(`Please fill in all required fields and select at least one image for all products. ${invalidProducts.length} product(s) have missing data.`);
      setIsSubmitting(false);
      return;
    }

    // Prepare form data
    const formData = new FormData();
    
    // Add products as JSON
    const productsData = products.map(p => ({
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      categoryId: p.categoryId,
      stock: parseInt(p.stock) || 0,
      isOnSale: p.isOnSale,
      isFeatured: p.isFeatured,
      salePrice: p.isOnSale && p.salePrice ? parseFloat(p.salePrice) : undefined,
      imageFileNames: p.imageFileNames,
    }));
    formData.append('products', JSON.stringify(productsData));

    // Add images
    uploadedImages.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });

    try {
      const result = await bulkCreateProducts(formData);
      setResults(result.results);
      setMessage(result.message);

      if (result.success) {
        // Reset form on complete success
        setProducts([createEmptyProduct()]);
        setUploadedImages([]);
      }
    } catch {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Image Upload Section */}
      <div className="rounded-xl bg-white border-2 border-dashed border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UploadIcon className="w-5 h-5" />
          Step 1: Upload Images
        </h2>
        
        <button
          type="button"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }
          `}
        >
          <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">
            Drag & drop images here, or click to select
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Supports JPG, PNG, WebP
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </button>

        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {uploadedImages.length} image(s) uploaded:
            </p>
            <div className="flex flex-wrap gap-3">
              {uploadedImages.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="relative group bg-gray-100 rounded-lg p-2 pr-8"
                >
                  <div className="flex items-center gap-2">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover rounded"
                      unoptimized
                    />
                    <span className="text-sm text-gray-600 max-w-[150px] truncate">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    aria-label="Remove image"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products Table Section */}
      <div className="rounded-xl bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Step 2: Add Product Details
          </h2>
          <button
            type="button"
            onClick={addProductRow}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-600">Name *</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Description *</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Price *</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Category *</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Stock</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Featured</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Sale</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Images *</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 align-top">
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                      placeholder="Product name"
                      className="w-full min-w-[140px] px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <textarea
                      value={product.description}
                      onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                      placeholder="Description"
                      rows={2}
                      className="w-full min-w-[180px] px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <input
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                      placeholder="0.00"
                      className="w-full min-w-[80px] px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <select
                      value={product.categoryId}
                      onChange={(e) => updateProduct(product.id, 'categoryId', e.target.value)}
                      className="w-full min-w-[180px] px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.fullPath}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2 align-top">
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => updateProduct(product.id, 'stock', e.target.value)}
                      placeholder="0"
                      className="w-full min-w-[60px] px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-2 align-top pt-3">
                    <input
                      type="checkbox"
                      checked={product.isFeatured}
                      onChange={(e) => updateProduct(product.id, 'isFeatured', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <div className="flex flex-col gap-1">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={product.isOnSale}
                          onChange={(e) => updateProduct(product.id, 'isOnSale', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs">Sale</span>
                      </label>
                      {product.isOnSale && (
                        <input
                          type="number"
                          step="0.01"
                          value={product.salePrice}
                          onChange={(e) => updateProduct(product.id, 'salePrice', e.target.value)}
                          placeholder="Sale price"
                          className="w-full min-w-[70px] px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2 align-top">
                    <div className="min-w-[160px]">
                      {uploadedImages.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Upload images first</p>
                      ) : (
                        <div className="max-h-[100px] overflow-y-auto border border-gray-200 rounded-md p-1 bg-white space-y-1">
                          {uploadedImages.map((file) => (
                            <label key={file.name} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={product.imageFileNames.includes(file.name)}
                                onChange={() => toggleImageSelection(product.id, file.name)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                              />
                              <span className={`text-[11px] truncate ${product.imageFileNames.includes(file.name) ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                                {file.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      {product.imageFileNames.length > 0 && (
                        <p className="text-[10px] text-blue-600 mt-1 font-medium">
                          {product.imageFileNames.length} image(s) selected
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2 align-top">
                    <button
                      type="button"
                      onClick={() => removeProductRow(product.id)}
                      disabled={products.length === 1}
                      className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remove product row"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          * Required fields. Upload images first, then select them from the dropdown for each product.
        </p>
      </div>

      {/* Results Section */}
      {results && results.length > 0 && (
        <div className="rounded-xl bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Results</h3>
          <div className="space-y-2">
            {results.map((result) => (
              <div
                key={result.name}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {result.success ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.name}
                  </p>
                  {result.error && (
                    <p className="text-sm text-red-600">{result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      {message && !results && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-yellow-800">{message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Link
          href="/admin"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || products.length === 0 || uploadedImages.length === 0}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating...
            </>
          ) : (
            <>Create {products.length} Product{products.length !== 1 ? 's' : ''}</>
          )}
        </button>
      </div>
    </form>
  );
}
