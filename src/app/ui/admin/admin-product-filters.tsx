"use client";

import { ArrowUpDownIcon, SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

type ProductSortField = "name" | "price" | "stock" | "category" | "created";
type SortOrder = "asc" | "desc";

const SORT_OPTIONS: Array<{ value: ProductSortField; label: string }> = [
  { value: "created", label: "Created Date" },
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
  { value: "stock", label: "Stock" },
  { value: "category", label: "Category" },
];

interface AdminProductFiltersProps {
  search: string;
  sort: ProductSortField;
  order: SortOrder;
  totalCount: number;
  filteredCount: number;
}

export default function AdminProductFilters({
  search,
  sort,
  order,
  totalCount,
  filteredCount,
}: AdminProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(search);
  const [sortValue, setSortValue] = useState<ProductSortField>(sort);
  const [orderValue, setOrderValue] = useState<SortOrder>(order);

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  useEffect(() => {
    setSortValue(sort);
  }, [sort]);

  useEffect(() => {
    setOrderValue(order);
  }, [order]);

  const navigateWithParams = useCallback(
    (nextSearch: string, nextSort: ProductSortField, nextOrder: SortOrder) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmedSearch = nextSearch.trim();

      if (trimmedSearch) {
        params.set("search", trimmedSearch);
      } else {
        params.delete("search");
      }

      if (nextSort !== "created") {
        params.set("sort", nextSort);
      } else {
        params.delete("sort");
      }

      if (nextOrder !== "desc") {
        params.set("order", nextOrder);
      } else {
        params.delete("order");
      }

      const queryString = params.toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const currentSearch = (searchParams.get("search") || "").trim();
    const nextSearch = searchValue.trim();
    if (currentSearch === nextSearch) {
      return;
    }

    const timeout = setTimeout(() => {
      navigateWithParams(searchValue, sortValue, orderValue);
    }, 300);

    return () => clearTimeout(timeout);
  }, [navigateWithParams, searchParams, searchValue, sortValue, orderValue]);

  const handleSortChange = (value: ProductSortField) => {
    setSortValue(value);
    navigateWithParams(searchValue, value, orderValue);
  };

  const handleOrderChange = (value: SortOrder) => {
    setOrderValue(value);
    navigateWithParams(searchValue, sortValue, value);
  };

  const handleClear = () => {
    setSearchValue("");
    setSortValue("created");
    setOrderValue("desc");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <label
            htmlFor="product-search"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Search products
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="product-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Type to search by name, category, description, or ID"
              className="block w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-2 placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="w-full sm:w-52">
          <label
            htmlFor="product-sort"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Sort field
          </label>
          <div className="relative">
            <ArrowUpDownIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              id="product-sort"
              value={sortValue}
              onChange={(event) =>
                handleSortChange(event.target.value as ProductSortField)
              }
              className="block w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-2"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full sm:w-44">
          <label
            htmlFor="product-order"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Order
          </label>
          <select
            id="product-order"
            value={orderValue}
            onChange={(event) =>
              handleOrderChange(event.target.value as SortOrder)
            }
            className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {isPending
          ? "Updating..."
          : `Showing ${filteredCount} of ${totalCount} products${search ? ` for "${search}"` : ""}.`}
      </p>
    </div>
  );
}
