import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchAllCategoriesFlat, fetchProductById } from "@/app/lib/data";
import ProductForm from "@/app/ui/admin/product-form";

export const metadata: Metadata = {
  title: "Edit Product",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    fetchProductById(id),
    fetchAllCategoriesFlat(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main>
      <h1 className="mb-4 text-xl md:text-2xl">Edit Product</h1>
      <ProductForm product={product} categories={categories} />
    </main>
  );
}
