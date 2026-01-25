import { fetchProducts } from '@/app/lib/data';
import type { ProductWithCategory } from '@/app/lib/definitions';
import Link from 'next/link';
import { PencilIcon, TrashIcon, PlusIcon, UploadIcon } from 'lucide-react';
import { deleteProduct } from '@/app/lib/actions';

export default async function AdminDashboard() {
  const products = await fetchProducts();
  const validProducts = products.filter((p): p is ProductWithCategory => p !== null);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl">Products - Royals and Radiant Admin</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/products/bulk"
            className="flex h-10 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <span className="hidden md:block">Bulk Upload</span>{' '}
            <UploadIcon className="h-5 md:ml-2" />
          </Link>
          <Link
            href="/admin/products/create"
            className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <span className="hidden md:block">Create Product</span>{' '}
            <PlusIcon className="h-5 md:ml-2" />
          </Link>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
            <table className="min-w-full text-gray-900">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-semibold sm:pl-6">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-5 font-semibold">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Price
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Sale
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Featured
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Stock
                  </th>
                  <th scope="col" className="relative py-3 pl-6 pr-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {validProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                  >
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <Link 
                          href={`/admin/products/${product.id}/edit`}
                          className="hover:text-blue-600 hover:underline transition-colors font-medium"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <Link 
                        href={`/admin/products/${product.id}/edit`}
                        className="block group"
                      >
                        {product.categoryRef ? (
                          <p className="group-hover:text-blue-600 transition-colors">{product.categoryRef.name}</p>
                        ) : (
                          <p className="capitalize text-gray-400 group-hover:text-blue-600 transition-colors">
                            {product.category || 'Uncategorized'}
                          </p>
                        )}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {product.isOnSale && product.salePrice ? (
                        <div>
                          <span className="line-through text-gray-400">${Number(product.price).toFixed(2)}</span>
                          <span className="ml-2 text-red-600 font-medium">${Number(product.salePrice).toFixed(2)}</span>
                        </div>
                      ) : (
                        <span>${Number(product.price).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {product.isOnSale ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          On Sale
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {product.isFeatured ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          Featured
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-md border p-2 hover:bg-gray-100"
                        >
                          <PencilIcon className="w-5" />
                        </Link>
                        <form action={deleteProduct.bind(null, product.id)}>
                            <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
                                <TrashIcon className="w-5" />
                            </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


