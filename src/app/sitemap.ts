import type { MetadataRoute } from "next";
import { fetchVisibleCategories, fetchProducts } from "./lib/data";
import type { Category, ProductWithCategory } from "./lib/definitions";
import { getBaseUrl } from "./lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/contact",
    "/sale",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  // Dynamic category routes
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = (await fetchVisibleCategories()) as Category[];
    categoryRoutes = categories.map((category) => ({
      url: `${baseUrl}/products/category/${category.slugPath}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error fetching categories for sitemap:", error);
  }

  // Dynamic product routes
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = (await fetchProducts()) as ProductWithCategory[];
    productRoutes = products
      .filter((product): product is ProductWithCategory => product !== null)
      .map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.6,
      }));
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
