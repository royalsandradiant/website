"use server";

import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import Stripe from "stripe";
import { z } from "zod";
import { auth } from "@/lib/auth";
import type {
  CategoryState,
  HeroViewport,
  ShippingCategory,
  State,
} from "./definitions";
import {
  ImageUploadValidationError,
  prepareWebpUploadFromFile,
} from "./image-upload";
import { prisma } from "./prisma";
import { buildTrackingLink } from "./shipping-tracking";
import { buildSlugPath, getBaseUrl, slugify } from "./utils";

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

function normalizeShippingCategoryInput(
  category: string | null | undefined,
): ShippingCategory {
  return category === "clothes" ? "clothes" : "jewelry";
}

function normalizeHeroViewportInput(
  viewport: string | null | undefined,
): HeroViewport {
  return viewport === "mobile" ? "mobile" : "desktop";
}

async function requireAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ? session : null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type ProductForPricing = {
  id: string;
  price: Prisma.Decimal;
  isOnSale: boolean;
  salePrice: Prisma.Decimal | null;
  variants: { colorName: string; price: Prisma.Decimal | null }[];
};

function unitPriceFromProductRow(
  p: ProductForPricing,
  color: string | null | undefined,
): number {
  let n = Number(p.price);
  if (p.isOnSale && p.salePrice != null) {
    n = Number(p.salePrice);
  }
  if (color) {
    const v = p.variants.find((x) => x.colorName === color);
    if (v?.price != null) {
      n = Number(v.price);
    }
  }
  return n;
}

const StripeWebhookMetadataItemSchema = z.object({
  id: z.string(),
  quantity: z.number().int().positive(),
  price: z.number(),
  name: z.string().optional(),
  comboId: z.string().nullable().optional(),
  originalProductId: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
});

// ===================
// Category Schemas
// ===================

const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isVisible: z.boolean().default(true),
  sortOrder: z.coerce.number().min(0).default(0),
});

const CreateCategory = CategorySchema.omit({ id: true });
const UpdateCategory = CategorySchema.omit({ id: true });

// ===================
// Category Actions
// ===================

async function revalidateCategoryPaths() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/products/category", "layout");
}

async function uploadImageAsWebp(file: File, folder?: string): Promise<string> {
  const { fileName, buffer, contentType } = await prepareWebpUploadFromFile(
    file,
    { folder },
  );
  const blob = await put(fileName, buffer, {
    access: "public",
    contentType,
  });
  return blob.url;
}

/**
 * Delete blob files from Vercel Blob storage.
 * Accepts a single URL, array of URLs, or null/undefined (no-op).
 * Silently ignores failures (e.g., blob already deleted).
 */
async function deleteBlobs(
  urls: string | string[] | null | undefined,
): Promise<void> {
  if (!urls) return;
  const urlsToDelete = Array.isArray(urls) ? urls : [urls];
  // Filter out empty strings
  const validUrls = urlsToDelete.filter(
    (url): url is string => !!url && url.length > 0,
  );
  if (validUrls.length === 0) return;
  try {
    await del(validUrls);
  } catch (error) {
    // Silently ignore errors - blob may already be deleted
    console.warn("Failed to delete some blobs:", error);
  }
}

export async function createCategory(
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  if (!(await requireAdminSession())) {
    redirect("/login");
  }
  const parentId = formData.get("parentId") as string | null;
  const isVisibleValue =
    formData.get("isVisible") === "on" || formData.get("isVisible") === "true";

  // Auto-generate slug from name if not provided
  const nameValue = formData.get("name") as string;
  let slugValue = formData.get("slug") as string;
  if (!slugValue && nameValue) {
    slugValue = slugify(nameValue);
  }

  const validatedFields = CreateCategory.safeParse({
    name: nameValue,
    slug: slugValue,
    description: formData.get("description") || undefined,
    parentId: parentId || null,
    isVisible: isVisibleValue,
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Category.",
    };
  }

  const { name, slug, description, isVisible, sortOrder } =
    validatedFields.data;

  // Get parent's slugPath if there's a parent
  let parentSlugPath: string | null = null;
  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: { slugPath: true },
    });
    if (!parent) {
      return { message: "Parent category not found." };
    }
    parentSlugPath = parent.slugPath;
  }

  const slugPath = buildSlugPath(parentSlugPath, slug);

  // Check for duplicate slug among siblings
  const existingCategory = await prisma.category.findFirst({
    where: {
      parentId: parentId || null,
      slug,
    },
  });

  if (existingCategory) {
    return {
      errors: {
        slug: ["A category with this slug already exists at this level."],
      },
      message: "Duplicate slug.",
    };
  }

  // Handle image upload
  let imageUrl: string | null = null;
  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImageAsWebp(imageFile, "categories");
    } catch (e) {
      console.error("Upload error", e);
      return {
        message:
          e instanceof ImageUploadValidationError
            ? e.message
            : "Image upload failed.",
      };
    }
  }

  try {
    await prisma.category.create({
      data: {
        name,
        slug,
        slugPath,
        description: description || null,
        parentId: parentId || null,
        isVisible,
        sortOrder,
        imageUrl,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Create Category." };
  }

  await revalidateCategoryPaths();
  redirect("/admin/categories");
}

export async function updateCategory(
  id: string,
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  if (!(await requireAdminSession())) {
    redirect("/login");
  }
  const parentId = formData.get("parentId") as string | null;
  const isVisibleValue =
    formData.get("isVisible") === "on" || formData.get("isVisible") === "true";

  const nameValue = formData.get("name") as string;
  let slugValue = formData.get("slug") as string;
  if (!slugValue && nameValue) {
    slugValue = slugify(nameValue);
  }

  const validatedFields = UpdateCategory.safeParse({
    name: nameValue,
    slug: slugValue,
    description: formData.get("description") || undefined,
    parentId: parentId || null,
    isVisible: isVisibleValue,
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Category.",
    };
  }

  const { name, slug, description, isVisible, sortOrder } =
    validatedFields.data;

  // Get current category
  const currentCategory = await prisma.category.findUnique({
    where: { id },
    include: { children: true },
  });

  if (!currentCategory) {
    return { message: "Category not found." };
  }

  // Prevent setting self as parent
  if (parentId === id) {
    return { message: "A category cannot be its own parent." };
  }

  // Get parent's slugPath
  let parentSlugPath: string | null = null;
  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: { slugPath: true },
    });
    if (!parent) {
      return { message: "Parent category not found." };
    }
    parentSlugPath = parent.slugPath;

    // Prevent circular reference
    if (parent.slugPath.startsWith(currentCategory.slugPath)) {
      return { message: "Cannot move a category under its own descendant." };
    }
  }

  const newSlugPath = buildSlugPath(parentSlugPath, slug);
  const oldSlugPath = currentCategory.slugPath;

  // Check for duplicate slug among siblings (excluding self)
  const existingCategory = await prisma.category.findFirst({
    where: {
      parentId: parentId || null,
      slug,
      NOT: { id },
    },
  });

  if (existingCategory) {
    return {
      errors: {
        slug: ["A category with this slug already exists at this level."],
      },
      message: "Duplicate slug.",
    };
  }

  // Handle image upload
  let imageUrl: string | undefined;
  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImageAsWebp(imageFile, "categories");
    } catch (e) {
      console.error("Upload error", e);
      return {
        message:
          e instanceof ImageUploadValidationError
            ? e.message
            : "Image upload failed.",
      };
    }
  }

  try {
    // Update this category
    await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        slugPath: newSlugPath,
        description: description || null,
        parentId: parentId || null,
        isVisible,
        sortOrder,
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    // If slugPath changed, update all descendants
    if (oldSlugPath !== newSlugPath) {
      const descendants = await prisma.category.findMany({
        where: { slugPath: { startsWith: `${oldSlugPath}/` } },
      });

      for (const desc of descendants) {
        const newDescSlugPath = desc.slugPath.replace(oldSlugPath, newSlugPath);
        await prisma.category.update({
          where: { id: desc.id },
          data: { slugPath: newDescSlugPath },
        });
      }
    }
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Update Category." };
  }

  await revalidateCategoryPaths();
  redirect("/admin/categories");
}

export async function deleteCategory(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!(await requireAdminSession())) {
    return { success: false, message: "Unauthorized." };
  }
  try {
    // Check for children
    const childCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      return {
        success: false,
        message:
          "Cannot delete a category that has subcategories. Move or delete them first.",
      };
    }

    // Check for products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return {
        success: false,
        message: `Cannot delete a category that has ${productCount} product(s). Reassign products first.`,
      };
    }

    // Get category image URL before deletion
    const category = await prisma.category.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    await prisma.category.delete({
      where: { id },
    });

    // Delete the blob image if it exists
    await deleteBlobs(category?.imageUrl);

    await revalidateCategoryPaths();
    return { success: true, message: "Category deleted successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to Delete Category.",
    };
  }
}

export async function reorderCategories(
  orderedIds: { id: string; sortOrder: number }[],
): Promise<{ success: boolean; message: string }> {
  if (!(await requireAdminSession())) {
    return { success: false, message: "Unauthorized." };
  }
  try {
    // Update all categories in a transaction
    await prisma.$transaction(
      orderedIds.map(({ id, sortOrder }) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder },
        }),
      ),
    );

    await revalidateCategoryPaths();
    return { success: true, message: "Categories reordered successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      message: "Database Error: Failed to reorder categories.",
    };
  }
}

// ===================
// Product Schemas
// ===================

const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().gt(0, "Price must be greater than 0"),
  categoryId: z.string().min(1, "Category is required"),
  stock: z.coerce.number().min(0, "Stock must be 0 or greater"),
  isOnSale: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  salePrice: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? null : Number(val),
    z.number().positive("Sale price must be positive").nullable(),
  ),
  salePercentage: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? null : Number(val),
    z
      .number()
      .min(0, "Percentage must be at least 0")
      .max(100, "Percentage cannot exceed 100")
      .nullable(),
  ),
  isCombo: z.boolean().default(false),
  sizeChartUrl: z.string().optional().nullable(),
  sizes: z.array(z.string()).default([]),
});

const CreateProduct = ProductSchema.omit({ id: true });
const UpdateProduct = ProductSchema.omit({ id: true });

export async function createProduct(_prevState: State, formData: FormData) {
  if (!(await requireAdminSession())) {
    redirect("/login");
  }
  const isOnSaleValue = formData.get("isOnSale") === "on";
  const isFeaturedValue = formData.get("isFeatured") === "on";
  const isComboValue = formData.get("isCombo") === "on";
  const salePriceValue = formData.get("salePrice");
  const salePercentageValue = formData.get("salePercentage");

  const validatedFields = CreateProduct.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    categoryId: formData.get("categoryId"),
    stock: formData.get("stock"),
    isOnSale: isOnSaleValue,
    isFeatured: isFeaturedValue,
    salePrice: isOnSaleValue && salePriceValue ? salePriceValue : null,
    salePercentage:
      isOnSaleValue && salePercentageValue ? salePercentageValue : null,
    isCombo: isComboValue,
    sizeChartUrl: (formData.get("existingSizeChartUrl") as string) || null,
    sizes: JSON.parse((formData.get("sizesJson") as string) || "[]"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Product.",
    };
  }

  const {
    name,
    description,
    price,
    categoryId,
    stock,
    isOnSale,
    isFeatured,
    salePrice,
    salePercentage,
    isCombo,
    sizes,
    sizeChartUrl,
  } = validatedFields.data;

  // Handle size chart upload
  const sizeChartFile = formData.get("sizeChart") as File | null;
  let finalSizeChartUrl = sizeChartUrl;
  if (sizeChartFile && sizeChartFile.size > 0) {
    try {
      finalSizeChartUrl = await uploadImageAsWebp(sizeChartFile, "size-charts");
    } catch (e) {
      console.error("Size chart upload error", e);
      return {
        message:
          e instanceof ImageUploadValidationError
            ? e.message
            : "Size chart upload failed.",
      };
    }
  }

  // Calculate sale price if percentage is provided
  let finalSalePrice = salePrice;
  if (isOnSale && salePercentage !== null) {
    finalSalePrice = price * (1 - salePercentage / 100);
  }

  // Validate category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return {
      errors: { categoryId: ["Selected category does not exist."] },
      message: "Invalid category.",
    };
  }

  const imageFiles = formData.getAll("images") as File[];
  const images: string[] = [];

  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
    for (const file of imageFiles) {
      if (file.size > 0) {
        try {
          images.push(await uploadImageAsWebp(file));
        } catch (e) {
          console.error("Upload error", e);
          return {
            message:
              e instanceof ImageUploadValidationError
                ? e.message
                : "Image upload failed.",
          };
        }
      }
    }
  } else {
    return { message: "At least one image is required." };
  }

  try {
    await prisma.product.create({
      data: {
        name,
        description,
        price,
        categoryId,
        stock,
        isOnSale,
        isFeatured,
        salePrice: finalSalePrice || null,
        salePercentage: salePercentage || null,
        isCombo,
        sizeChartUrl: finalSizeChartUrl,
        sizes,
        images,
        variants: {
          create: JSON.parse(
            (formData.get("variantsJson") as string) || "[]",
          ).map((v: any) => ({
            colorName: v.colorName,
            hexCode: v.hexCode,
            price: v.price ? parseFloat(v.price) : null,
            stock: parseInt(v.stock || "0"),
            sizes: v.sizes || [],
            imageUrl: v.imageUrl || null,
            images: v.images || [],
          })),
        },
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Create Product." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/sale");
  revalidatePath("/combos");
  revalidatePath("/products/category", "layout");
  redirect("/admin");
}

export async function updateProduct(
  id: string,
  _prevState: State,
  formData: FormData,
) {
  if (!(await requireAdminSession())) {
    redirect("/login");
  }
  const isOnSaleValue = formData.get("isOnSale") === "on";
  const isFeaturedValue = formData.get("isFeatured") === "on";
  const isComboValue = formData.get("isCombo") === "on";
  const salePriceValue = formData.get("salePrice");
  const salePercentageValue = formData.get("salePercentage");

  const validatedFields = UpdateProduct.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    categoryId: formData.get("categoryId"),
    stock: formData.get("stock"),
    isOnSale: isOnSaleValue,
    isFeatured: isFeaturedValue,
    salePrice: isOnSaleValue && salePriceValue ? salePriceValue : null,
    salePercentage:
      isOnSaleValue && salePercentageValue ? salePercentageValue : null,
    isCombo: isComboValue,
    sizeChartUrl: (formData.get("existingSizeChartUrl") as string) || null,
    sizes: JSON.parse((formData.get("sizesJson") as string) || "[]"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Product.",
    };
  }

  const {
    name,
    description,
    price,
    categoryId,
    stock,
    isOnSale,
    isFeatured,
    salePrice,
    salePercentage,
    isCombo,
    sizes,
    sizeChartUrl,
  } = validatedFields.data;

  // Handle size chart upload
  const sizeChartFile = formData.get("sizeChart") as File | null;
  let finalSizeChartUrl = sizeChartUrl;
  if (sizeChartFile && sizeChartFile.size > 0) {
    try {
      finalSizeChartUrl = await uploadImageAsWebp(sizeChartFile, "size-charts");
    } catch (e) {
      console.error("Size chart upload error", e);
      return {
        message:
          e instanceof ImageUploadValidationError
            ? e.message
            : "Size chart upload failed.",
      };
    }
  }

  // Calculate sale price if percentage is provided
  let finalSalePrice = salePrice;
  if (isOnSale && salePercentage !== null) {
    finalSalePrice = price * (1 - salePercentage / 100);
  }

  // Validate category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return {
      errors: { categoryId: ["Selected category does not exist."] },
      message: "Invalid category.",
    };
  }

  // Get existing images from form data
  const existingImages = formData.getAll("existingImages") as string[];

  const imageFiles = formData.getAll("images") as File[];
  const newImages: string[] = [];

  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
    for (const file of imageFiles) {
      if (file.size > 0) {
        try {
          newImages.push(await uploadImageAsWebp(file));
        } catch (e) {
          console.error("Upload error", e);
          return {
            message:
              e instanceof ImageUploadValidationError
                ? e.message
                : "Image upload failed.",
          };
        }
      }
    }
  }

  const images = [...existingImages, ...newImages];

  if (images.length === 0) {
    return { message: "At least one image is required." };
  }

  try {
    const variants = JSON.parse(
      (formData.get("variantsJson") as string) || "[]",
    );

    await prisma.$transaction([
      // Delete old variants
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      // Update product and create new variants
      prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          price,
          categoryId,
          stock,
          isOnSale,
          isFeatured,
          salePrice: finalSalePrice || null,
          salePercentage: salePercentage || null,
          isCombo,
          sizeChartUrl: finalSizeChartUrl,
          sizes,
          images,
          variants: {
            create: variants.map((v: any) => ({
              colorName: v.colorName,
              hexCode: v.hexCode,
              price: v.price ? parseFloat(v.price) : null,
              stock: parseInt(v.stock || "0"),
              sizes: v.sizes || [],
              imageUrl: v.imageUrl || null,
              images: v.images || [],
            })),
          },
        },
      }),
    ]);
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Update Product." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/sale");
  revalidatePath("/combos");
  revalidatePath("/products/category", "layout");
  redirect("/admin");
}

export async function deleteProduct(id: string) {
  if (!(await requireAdminSession())) {
    redirect("/login");
  }
  try {
    // Get product with all images before deletion (variants will cascade delete)
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        images: true,
        sizeChartUrl: true,
        variants: {
          select: {
            imageUrl: true,
            images: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error("Product not found.");
    }

    await prisma.product.delete({
      where: { id },
    });

    // Collect all blob URLs to delete
    const urlsToDelete: string[] = [
      ...product.images,
      ...(product.sizeChartUrl ? [product.sizeChartUrl] : []),
    ];

    // Add variant images
    for (const variant of product.variants) {
      if (variant.imageUrl) urlsToDelete.push(variant.imageUrl);
      urlsToDelete.push(...variant.images);
    }

    // Delete all blob images
    await deleteBlobs(urlsToDelete);

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/sale");
    revalidatePath("/products/category", "layout");
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Database Error: Failed to Delete Product.");
  }
}

export type BulkProductResult = {
  success: boolean;
  name: string;
  error?: string;
};

export async function bulkCreateProducts(formData: FormData): Promise<{
  success: boolean;
  results: BulkProductResult[];
  message: string;
}> {
  if (!(await requireAdminSession())) {
    return {
      success: false,
      results: [],
      message: "Unauthorized.",
    };
  }
  const results: BulkProductResult[] = [];

  // Parse the products JSON from form data
  const productsJson = formData.get("products") as string;
  let products: Array<{
    name: string;
    description: string;
    price: number;
    categoryId: string;
    stock: number;
    isOnSale: boolean;
    isFeatured?: boolean;
    isCombo?: boolean;
    salePrice?: number;
    salePercentage?: number;
    imageFileNames: string[];
    sizeChartFileName?: string;
    sizes?: string[];
    variant?: {
      colorName: string;
      hexCode?: string;
      price?: number;
      stock?: number;
      sizes?: string[];
    };
  }>;

  try {
    products = JSON.parse(productsJson);
  } catch {
    return {
      success: false,
      results: [],
      message: "Invalid product data format.",
    };
  }

  if (!products || products.length === 0) {
    return { success: false, results: [], message: "No products to create." };
  }

  // Get all uploaded images
  const imageFiles: Map<string, File> = new Map();
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("image_") && value instanceof File && value.size > 0) {
      imageFiles.set(value.name, value);
    }
  }

  // Process each product
  for (const product of products) {
    const productResult: BulkProductResult = {
      success: false,
      name: product.name,
    };

    // Validate product data
    const validatedFields = CreateProduct.safeParse({
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId,
      stock: product.stock,
      isOnSale: product.isOnSale || false,
      isFeatured: product.isFeatured || false,
      isCombo: product.isCombo || false,
      salePrice: product.isOnSale ? (product.salePrice ?? null) : null,
      salePercentage: product.isOnSale
        ? (product.salePercentage ?? null)
        : null,
      sizeChartUrl: null, // Will be set later if size chart is provided
      sizes: product.sizes || [],
    });

    if (!validatedFields.success) {
      productResult.error =
        "Validation failed: " +
        Object.values(validatedFields.error.flatten().fieldErrors)
          .flat()
          .join(", ");
      results.push(productResult);
      continue;
    }

    // Find the matching image files
    const productImages: string[] = [];
    let uploadError = false;

    for (const fileName of product.imageFileNames) {
      const imageFile = imageFiles.get(fileName);
      if (!imageFile) {
        productResult.error = `Image not found: ${fileName}`;
        uploadError = true;
        break;
      }

      // Upload image to Vercel Blob
      try {
        productImages.push(await uploadImageAsWebp(imageFile));
      } catch (e) {
        console.error("Upload error", e);
        productResult.error =
          e instanceof ImageUploadValidationError
            ? e.message
            : "Image upload failed";
        uploadError = true;
        break;
      }
    }

    if (uploadError) {
      results.push(productResult);
      continue;
    }

    if (productImages.length === 0) {
      productResult.error = "No images provided";
      results.push(productResult);
      continue;
    }

    // Handle size chart upload if provided
    let sizeChartUrl: string | null = null;
    if (product.sizeChartFileName) {
      const sizeChartFile = imageFiles.get(product.sizeChartFileName);
      if (sizeChartFile) {
        try {
          sizeChartUrl = await uploadImageAsWebp(sizeChartFile, "size-charts");
        } catch (e) {
          console.error("Size chart upload error", e);
          productResult.error =
            e instanceof ImageUploadValidationError
              ? e.message
              : "Size chart upload failed";
          results.push(productResult);
          continue;
        }
      }
    }

    // Create product in database
    try {
      const {
        name,
        description,
        price,
        categoryId,
        stock,
        isOnSale,
        isFeatured,
        isCombo,
        salePrice,
        salePercentage,
        sizes,
      } = validatedFields.data;

      // Calculate sale price if percentage is provided
      let finalSalePrice = salePrice;
      if (isOnSale && salePercentage !== null) {
        finalSalePrice = price * (1 - salePercentage / 100);
      }

      // Build variant data if provided
      const variantData = product.variant?.colorName
        ? {
            create: [
              {
                colorName: product.variant.colorName,
                hexCode: product.variant.hexCode || null,
                price: product.variant.price || null,
                stock: product.variant.stock || 0,
                sizes: product.variant.sizes || [],
                imageUrl: null,
                images: productImages, // All product images go to the variant
              },
            ],
          }
        : undefined;

      await prisma.product.create({
        data: {
          name,
          description,
          price,
          categoryId,
          stock,
          isOnSale,
          isFeatured,
          isCombo,
          salePrice: finalSalePrice || null,
          salePercentage: salePercentage || null,
          sizeChartUrl,
          sizes,
          images: productImages,
          variants: variantData,
        },
      });
      productResult.success = true;
    } catch (error) {
      console.error("Database error", error);
      productResult.error = "Database error";
    }

    results.push(productResult);
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/sale");
  revalidatePath("/combos");
  revalidatePath("/products/category", "layout");

  return {
    success: failCount === 0,
    results,
    message: `Created ${successCount} products successfully${failCount > 0 ? `, ${failCount} failed` : ""}.`,
  };
}

const OrderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  totalAmount: z.number().gt(0),
  paymentId: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
      price: z.number(),
      size: z.string().optional().nullable(),
    }),
  ),
});

export async function createOrder(data: z.infer<typeof OrderSchema>) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  const validation = OrderSchema.safeParse(data);

  if (!validation.success) {
    return { success: false, error: "Invalid Data" };
  }

  const orderData = validation.data;

  try {
    await prisma.order.create({
      data: {
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        addressLine1: orderData.addressLine1,
        addressLine2: orderData.addressLine2,
        city: orderData.city,
        postalCode: orderData.postalCode,
        country: orderData.country,
        totalAmount: orderData.totalAmount,
        paymentId: orderData.paymentId,
        status: "PENDING",
        items: {
          create: orderData.items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
          })),
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Order creation failed", error);
    return { success: false, error: "Database Error" };
  }
}

// Contact form schema
const ContactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormState = {
  success?: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    subject?: string[];
    message?: string[];
  };
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot check
  const website = formData.get("b_website");
  const formTs = formData.get("form_ts");
  const currentTime = Date.now();

  // If honeypot is filled OR form was submitted in less than 3 seconds
  if (website || (formTs && currentTime - Number(formTs) < 3000)) {
    console.warn("Bot detected: Honeypot or fast submission.");
    return {
      success: true,
      message: "Thank you! Your message has been sent successfully.",
    };
  }

  const validatedFields = ContactFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please fix the errors above.",
    };
  }

  const { name, email, subject, message } = validatedFields.data;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessageHtml = escapeHtml(message).replace(/\n/g, "<br>");

  try {
    // Send email to the store owner
    await resend.emails.send({
      from: "Royals and Radiant <confirmation@confirmation.royalsandradiant.com>",
      to: process.env.CONTACT_EMAIL || "",
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="background-color: #F2F0EA; padding: 40px 20px; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2A24;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #F9F7F2; border: 1px solid #DED8CD; padding: 40px; border-radius: 4px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: 'Italiana', serif; font-size: 28px; font-weight: 400; margin: 0; color: #2C2A24; letter-spacing: -0.02em;">
                Royals and Radiant
              </h1>
              <p style="font-size: 12px; color: #2C2A24; opacity: 0.6; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">
                by Upasana and Foram
              </p>
              <div style="height: 1px; background-color: #C4A484; width: 60px; margin: 20px auto;"></div>
            </div>

            <!-- Content -->
            <h2 style="font-family: 'Italiana', serif; font-size: 22px; font-weight: 400; margin: 0 0 20px 0; color: #9A3B3B;">
              New Contact Form Submission
            </h2>
            
            <div style="margin-bottom: 30px;">
              <div style="margin-bottom: 15px;">
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; display: block; margin-bottom: 4px;">Name</span>
                <span style="font-size: 16px;">${safeName}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; display: block; margin-bottom: 4px;">Email</span>
                <span style="font-size: 16px;">${safeEmail}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; display: block; margin-bottom: 4px;">Subject</span>
                <span style="font-size: 16px;">${safeSubject}</span>
              </div>
            </div>

            <div style="padding: 25px; background-color: #F2F0EA; border-left: 4px solid #9A3B3B; border-radius: 0 4px 4px 0;">
              <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; display: block; margin-bottom: 10px;">Message</span>
              <div style="font-size: 15px; line-height: 1.6; color: #2C2A24;">${safeMessageHtml}</div>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #DED8CD; text-align: center;">
              <p style="font-size: 13px; color: #2C2A24; opacity: 0.5; margin: 0;">
                Sent via Royals and Radiant Contact Form
              </p>
            </div>
          </div>
        </div>
      `,
    });

    // Send confirmation email to the customer
    await resend.emails.send({
      from: "Royals and Radiant <confirmation@confirmation.royalsandradiant.com>",
      to: email,
      subject: "Thank you for contacting Royals and Radiant",
      html: `
        <div style="background-color: #F2F0EA; padding: 40px 20px; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2A24;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #F9F7F2; border: 1px solid #DED8CD; padding: 40px; border-radius: 4px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: 'Italiana', serif; font-size: 28px; font-weight: 400; margin: 0; color: #2C2A24; letter-spacing: -0.02em;">
                Royals and Radiant
              </h1>
              <p style="font-size: 12px; color: #2C2A24; opacity: 0.6; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">
                by Upasana and Foram
              </p>
              <div style="height: 1px; background-color: #C4A484; width: 60px; margin: 20px auto;"></div>
            </div>

            <!-- Content -->
            <h2 style="font-family: 'Italiana', serif; font-size: 22px; font-weight: 400; margin: 0 0 20px 0; color: #9A3B3B;">
              Thank You for Reaching Out
            </h2>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Dear ${safeName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              We have received your message and will get back to you within 24 hours. Where tradition meets modern elegance, we are honored to be part of your unique journey.
            </p>

            <div style="padding: 25px; background-color: #F2F0EA; border-left: 4px solid #C4A484; border-radius: 0 4px 4px 0;">
              <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B; display: block; margin-bottom: 10px;">Your Message Copy</span>
              <div style="font-size: 14px; line-height: 1.6; color: #2C2A24; opacity: 0.8;">
                <strong>Subject:</strong> ${safeSubject}<br><br>
                ${safeMessageHtml}
              </div>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #DED8CD; text-align: center;">
              <p style="font-size: 14px; font-weight: 600; color: #2C2A24; margin-bottom: 4px;">
                Royals and Radiant Team
              </p>
              <p style="font-size: 12px; color: #2C2A24; opacity: 0.6; margin: 0;">
                Upasana and Foram
              </p>
            </div>
          </div>
        </div>
      `,
    });

    return {
      success: true,
      message: "Thank you! Your message has been sent successfully.",
    };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      message: "Failed to send message. Please try again later.",
    };
  }
}

// Fetch order by Stripe session ID
export async function getOrderBySessionId(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer"],
    });

    if (session.status !== "complete") {
      return null;
    }
    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    if (!paid) {
      return null;
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId) {
      return null;
    }

    let order = await prisma.order.findFirst({
      where: {
        OR: [{ paymentIntentId }, { paymentId: paymentIntentId }],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      // Beat the webhook race: user often lands on /success before Stripe POSTs.
      try {
        await fulfillCheckoutSessionCompleted(session);
      } catch (syncError) {
        console.error(
          "Checkout success sync failed (webhook may still process):",
          syncError,
        );
      }
      order = await prisma.order.findFirst({
        where: {
          OR: [{ paymentIntentId }, { paymentId: paymentIntentId }],
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    }

    if (!order) {
      return null;
    }

    const shippingAddressFromJson =
      order.shippingAddress &&
      typeof order.shippingAddress === "object" &&
      !Array.isArray(order.shippingAddress)
        ? (order.shippingAddress as Record<string, unknown>)
        : null;

    const shippingAddress = {
      line1:
        typeof shippingAddressFromJson?.line1 === "string"
          ? shippingAddressFromJson.line1
          : order.addressLine1,
      line2:
        typeof shippingAddressFromJson?.line2 === "string"
          ? shippingAddressFromJson.line2
          : order.addressLine2,
      city:
        typeof shippingAddressFromJson?.city === "string"
          ? shippingAddressFromJson.city
          : order.city,
      postalCode:
        typeof shippingAddressFromJson?.postalCode === "string"
          ? shippingAddressFromJson.postalCode
          : order.postalCode,
      country:
        typeof shippingAddressFromJson?.country === "string"
          ? shippingAddressFromJson.country
          : order.country,
    };

    let pickupLocation: string | null = null;
    if (order.isPickup) {
      const storeSettings = await prisma.settings.findUnique({
        where: { id: "global" },
        select: { pickupAddress: true },
      });
      pickupLocation = storeSettings?.pickupAddress ?? null;
    }

    return {
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
        size: item.size,
        color: item.color,
      })),
      shippingAddress,
      isPickup: order.isPickup,
      pickupLocation,
    };
  } catch (error) {
    console.error("Error fetching order by session ID:", error);
    return null;
  }
}

// Stripe Checkout Types
export type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  images?: string[];
  comboId?: string;
  originalProductId?: string;
  color?: string;
  size?: string;
};

export type ShippingInfo = {
  customerName: string;
  customerEmail: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
};

export async function createStripeCheckoutSession(
  items: CheckoutItem[],
  shippingInfo: ShippingInfo,
  shippingCost: number = 0,
  coupon?: { code: string; discountAmount?: number },
  isPickup: boolean = false,
): Promise<{ url: string | null; error?: string }> {
  try {
    // Get base URL with fallback for local development
    const appUrl = getBaseUrl();
    if (!appUrl) {
      return { url: null, error: "Base URL is not set" };
    }

    if (items.length === 0) {
      return { url: null, error: "Your cart is empty." };
    }

    // Find existing customer or create new one to pre-fill Stripe checkout
    let customerId: string | undefined;
    const existingCustomers = await stripe.customers.list({
      email: shippingInfo.customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      // Update existing customer with new shipping info
      const customer = await stripe.customers.update(
        existingCustomers.data[0].id,
        {
          name: shippingInfo.customerName,
          ...(!isPickup && {
            shipping: {
              name: shippingInfo.customerName,
              address: {
                line1: shippingInfo.addressLine1,
                line2: shippingInfo.addressLine2 || undefined,
                city: shippingInfo.city,
                postal_code: shippingInfo.postalCode,
                country: shippingInfo.country,
              },
            },
          }),
        },
      );
      customerId = customer.id;
    } else {
      // Create new customer with shipping info
      const customer = await stripe.customers.create({
        email: shippingInfo.customerEmail,
        name: shippingInfo.customerName,
        ...(!isPickup && {
          shipping: {
            name: shippingInfo.customerName,
            address: {
              line1: shippingInfo.addressLine1,
              line2: shippingInfo.addressLine2 || undefined,
              city: shippingInfo.city,
              postal_code: shippingInfo.postalCode,
              country: shippingInfo.country,
            },
          },
        }),
      });
      customerId = customer.id;
    }

    type ResolvedLine = {
      item: CheckoutItem;
      unitPrice: number;
      displayName: string;
    };
    const resolvedLines: ResolvedLine[] = [];

    const comboGroups = new Map<string, CheckoutItem[]>();
    const regularItems: CheckoutItem[] = [];
    for (const item of items) {
      if (item.comboId) {
        const g = comboGroups.get(item.comboId) ?? [];
        g.push(item);
        comboGroups.set(item.comboId, g);
      } else {
        regularItems.push(item);
      }
    }

    const productIds = new Set<string>();
    for (const item of regularItems) {
      productIds.add(item.id);
    }
    for (const [, group] of comboGroups) {
      for (const item of group) {
        if (!item.originalProductId) {
          return { url: null, error: "Invalid combo cart item." };
        }
        productIds.add(item.originalProductId);
      }
    }

    const products = await prisma.product.findMany({
      where: { id: { in: [...productIds] } },
      select: {
        id: true,
        price: true,
        isOnSale: true,
        salePrice: true,
        variants: { select: { colorName: true, price: true } },
      },
    });
    if (products.length !== productIds.size) {
      return {
        url: null,
        error: "A product in your cart is no longer available.",
      };
    }
    const productById = new Map<string, ProductForPricing>(
      products.map((p) => [p.id, p]),
    );

    const settingsRow = await prisma.settings.findUnique({
      where: { id: "global" },
    });
    const comboDiscount2 = settingsRow?.comboDiscount2 ?? 10;
    const comboDiscount3 = settingsRow?.comboDiscount3 ?? 15;

    const unitPriceFromDb = (productId: string, color?: string | null) => {
      const p = productById.get(productId);
      if (!p) return null;
      return unitPriceFromProductRow(p, color);
    };

    for (const item of regularItems) {
      const u = unitPriceFromDb(item.id, item.color);
      if (u === null) {
        return {
          url: null,
          error: "A product in your cart is no longer available.",
        };
      }
      resolvedLines.push({ item, unitPrice: u, displayName: item.name });
    }

    for (const [, group] of comboGroups) {
      if (group.length < 2 || group.length > 3) {
        return { url: null, error: "Invalid combo selection." };
      }
      const pct = group.length === 2 ? comboDiscount2 : comboDiscount3;
      const weights: number[] = [];
      for (const item of group) {
        const origId = item.originalProductId;
        if (!origId) {
          return { url: null, error: "Invalid combo cart item." };
        }
        const u = unitPriceFromDb(origId, item.color);
        if (u === null) {
          return {
            url: null,
            error: "A combo product is no longer available.",
          };
        }
        weights.push(u * item.quantity);
      }
      const originalSubtotal = weights.reduce((a, b) => a + b, 0);
      const comboSubtotal = originalSubtotal * (1 - pct / 100);
      const wsum = weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < group.length; i++) {
        const item = group[i];
        const w = weights[i];
        if (item === undefined || w === undefined) {
          return { url: null, error: "Invalid combo selection." };
        }
        const share = wsum > 0 ? w / wsum : 1 / group.length;
        const lineTotal = comboSubtotal * share;
        const unitPrice =
          item.quantity > 0 ? lineTotal / item.quantity : lineTotal;
        resolvedLines.push({
          item,
          unitPrice,
          displayName: item.name,
        });
      }
    }

    const cartSubtotal = resolvedLines.reduce(
      (s, r) => s + r.unitPrice * r.item.quantity,
      0,
    );

    let serverDiscountAmount = 0;
    let couponCodeForMetadata = "";
    if (coupon?.code?.trim()) {
      const code = coupon.code.trim();
      const v = await validateCoupon(code, cartSubtotal);
      if (!v.success || !v.coupon) {
        return { url: null, error: v.error || "Invalid coupon." };
      }
      const applied = v.coupon;
      couponCodeForMetadata = applied.code;
      if (applied.discountType === "PERCENTAGE") {
        serverDiscountAmount =
          (cartSubtotal * applied.discountValue) / 100;
      } else {
        serverDiscountAmount = applied.discountValue;
      }
      serverDiscountAmount = Math.min(
        Math.max(0, serverDiscountAmount),
        cartSubtotal,
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      resolvedLines.map((r) => {
        const firstImage = r.item.images?.[0];
        return {
          price_data: {
            currency: "usd",
            tax_behavior: "exclusive",
            product_data: {
              name: r.displayName,
              images: firstImage ? [firstImage] : [],
            },
            unit_amount: Math.round(r.unitPrice * 100),
          },
          quantity: r.item.quantity,
        };
      });

    // Add Shipping Line Item (Feature 5)
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          tax_behavior: "exclusive",
          product_data: {
            name: "Shipping & Handling",
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    if (serverDiscountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          tax_behavior: "exclusive",
          product_data: {
            name: `Discount: ${couponCodeForMetadata}`,
          },
          unit_amount: -Math.round(serverDiscountAmount * 100),
        },
        quantity: 1,
      });
    }

    const orderId = `ORD-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;

    const itemsMetadata = resolvedLines.map((r) => ({
      id: r.item.originalProductId || r.item.id,
      quantity: r.item.quantity,
      price: r.unitPrice,
      name: r.displayName,
      comboId: r.item.comboId ?? null,
      originalProductId: r.item.originalProductId ?? null,
      color: r.item.color ?? null,
      size: r.item.size ?? null,
    }));

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      automatic_tax: { enabled: true },
      customer_update: {
        name: "auto",
        shipping: "auto",
        address: "auto",
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      customer: customerId,
      payment_intent_data: {
        metadata: {
          orderId: orderId,
          customerName: shippingInfo.customerName,
          addressLine1: shippingInfo.addressLine1,
          addressLine2: shippingInfo.addressLine2 || "",
          city: shippingInfo.city,
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country,
          items: JSON.stringify(itemsMetadata),
          couponCode: couponCodeForMetadata,
          discountAmount: serverDiscountAmount.toString(),
          isPickup: isPickup ? "true" : "false",
        },
      },
      metadata: {
        orderId: orderId,
        customerName: shippingInfo.customerName,
        addressLine1: shippingInfo.addressLine1,
        addressLine2: shippingInfo.addressLine2 || "",
        city: shippingInfo.city,
        postalCode: shippingInfo.postalCode,
        country: shippingInfo.country,
        items: JSON.stringify(itemsMetadata),
        couponCode: couponCodeForMetadata,
        discountAmount: serverDiscountAmount.toString(),
        isPickup: isPickup ? "true" : "false",
      },
      ...(isPickup
        ? {
            billing_address_collection: "required",
          }
        : {
            shipping_address_collection: {
              allowed_countries: ["US", "CA", "GB", "AU", "IN"],
            },
          }),
    });

    return { url: session.url };
  } catch (error) {
    console.error("Stripe session error:", error);
    return { url: null, error: "Failed to create checkout session" };
  }
}

// Order Confirmation Email Types
type OrderConfirmationItem = {
  name: string;
  quantity: number;
  price: number;
  size?: string | null;
};

type OrderConfirmationData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderConfirmationItem[];
  totalAmount: number;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
  isPickup: boolean;
};

const STORE_PICKUP_ADDRESS = {
  line1: "210 Terrace Avenue",
  line2: null,
  city: "Jersey City",
  postalCode: "NJ 07307",
  country: "United States",
};

async function sendOrderConfirmationEmail(
  data: OrderConfirmationData,
): Promise<void> {
  const {
    orderId,
    customerName,
    customerEmail,
    items,
    totalAmount,
    shippingAddress,
    isPickup,
  } = data;

  // Generate items HTML
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #DED8CD;">
        <span style="font-size: 15px; color: #2C2A24;">${item.name}${item.size ? ` (Size: ${item.size})` : ""}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #DED8CD; text-align: center;">
        <span style="font-size: 15px; color: #2C2A24;">${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #DED8CD; text-align: right;">
        <span style="font-size: 15px; color: #2C2A24;">$${(item.price * item.quantity).toFixed(2)}</span>
      </td>
    </tr>
  `,
    )
    .join("");

  // Format address (use store address for pickup orders)
  const addressToUse = isPickup ? STORE_PICKUP_ADDRESS : shippingAddress;
  const formattedAddress = [
    addressToUse.line1,
    addressToUse.line2,
    `${addressToUse.city}, ${addressToUse.postalCode}`,
    addressToUse.country,
  ]
    .filter(Boolean)
    .join("<br>");

  await resend.emails.send({
    from: "Royals and Radiant <confirmation@confirmation.royalsandradiant.com>",
    to: customerEmail,
    subject: `Order Confirmed - ${orderId}`,
    html: `
      <div style="background-color: #F2F0EA; padding: 40px 20px; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2A24;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #F9F7F2; border: 1px solid #DED8CD; padding: 40px; border-radius: 4px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-family: 'Italiana', serif; font-size: 28px; font-weight: 400; margin: 0; color: #2C2A24; letter-spacing: -0.02em;">
              Royals and Radiant
            </h1>
            <p style="font-size: 12px; color: #2C2A24; opacity: 0.6; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">
              by Upasana and Foram
            </p>
            <div style="height: 1px; background-color: #C4A484; width: 60px; margin: 20px auto;"></div>
          </div>

          <!-- Order Confirmation Badge -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #E8F5E9; border: 1px solid #A5D6A7; border-radius: 50px; padding: 8px 20px;">
              <span style="color: #2E7D32; font-size: 14px; font-weight: 600;">Order Confirmed</span>
            </div>
          </div>

          <!-- Greeting -->
          <h2 style="font-family: 'Italiana', serif; font-size: 22px; font-weight: 400; margin: 0 0 20px 0; color: #9A3B3B;">
            Thank You for Your Order!
          </h2>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Dear ${customerName},
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            We're delighted to confirm your order. Your exquisite jewelry is being prepared with care and will be on its way to you soon.
          </p>

          <!-- Order Number -->
          <div style="background-color: #F2F0EA; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #C4A484; display: block; margin-bottom: 8px;">Order Number</span>
            <span style="font-size: 20px; font-weight: 700; color: #9A3B3B; font-family: monospace;">${orderId}</span>
          </div>

          <!-- Order Items -->
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; margin: 0 0 15px 0;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 12px 0; border-bottom: 2px solid #C4A484; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B;">Item</th>
                  <th style="padding: 12px 0; border-bottom: 2px solid #C4A484; text-align: center; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B;">Qty</th>
                  <th style="padding: 12px 0; border-bottom: 2px solid #C4A484; text-align: right; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 15px 0; text-align: right; font-size: 16px; font-weight: 600; color: #2C2A24;">Total</td>
                  <td style="padding: 15px 0; text-align: right; font-size: 18px; font-weight: 700; color: #9A3B3B;">$${totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Shipping/Pickup Address -->
          <div style="background-color: #F2F0EA; border-left: 4px solid #C4A484; border-radius: 0 8px 8px 0; padding: 20px; margin-bottom: 30px;">
            <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B; margin: 0 0 12px 0;">${isPickup ? "Pickup Location" : "Shipping Address"}</h3>
            <p style="font-size: 15px; line-height: 1.8; color: #2C2A24; margin: 0;">
              ${isPickup ? "" : `${customerName}<br>`}
              ${formattedAddress}
            </p>
          </div>

          <!-- What's Next -->
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; margin: 0 0 15px 0;">What's Next?</h3>
            <ul style="padding-left: 20px; margin: 0;">
              ${isPickup ? `
              <li style="font-size: 15px; line-height: 1.8; color: #2C2A24; margin-bottom: 8px;">Your order will be prepared for pickup</li>
              <li style="font-size: 15px; line-height: 1.8; color: #2C2A24; margin-bottom: 8px;">We'll notify you when your order is ready for pickup</li>
              <li style="font-size: 15px; line-height: 1.8; color: #2C2A24;">Please bring a valid ID when picking up your order</li>
              ` : `
              <li style="font-size: 15px; line-height: 1.8; color: #2C2A24; margin-bottom: 8px;">We'll notify you when your order ships</li>
              <li style="font-size: 15px; line-height: 1.8; color: #2C2A24; margin-bottom: 8px;">Tracking information will be included in the shipping email</li>
              <li style="font-size: 15px; line-height: 1.8; color: #2C2A24;">Estimated delivery: 5-7 business days</li>
              `}
            </ul>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #DED8CD; text-align: center;">
            <p style="font-size: 14px; font-weight: 600; color: #2C2A24; margin-bottom: 4px;">
              Questions about your order?
            </p>
            <p style="font-size: 13px; color: #2C2A24; opacity: 0.7; margin: 0 0 15px 0;">
              Reply to this email and we'll be happy to help.
            </p>
            <div style="height: 1px; background-color: #DED8CD; width: 100px; margin: 20px auto;"></div>
            <p style="font-size: 12px; color: #2C2A24; opacity: 0.5; margin: 0;">
              With gratitude,<br>
              <strong>Royals and Radiant</strong><br>
              Upasana and Foram
            </p>
          </div>
        </div>
      </div>
    `,
  });
}

async function sendStoreOrderNotificationEmail(
  data: StoreNotificationData,
): Promise<void> {
  const {
    orderId,
    customerName,
    customerEmail,
    items,
    totalAmount,
    shippingAddress,
    isPickup,
    couponCode,
    discountAmount,
    createdAt,
  } = data;

  const storeEmail = process.env.CONTACT_EMAIL;
  if (!storeEmail) {
    console.warn("CONTACT_EMAIL not set, skipping store notification");
    return;
  }

  // Generate items HTML
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #DED8CD;">
        <span style="font-size: 15px; color: #2C2A24;">${item.name}${item.size ? ` (Size: ${item.size})` : ""}${item.color ? ` (Color: ${item.color})` : ""}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #DED8CD; text-align: center;">
        <span style="font-size: 15px; color: #2C2A24;">${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #DED8CD; text-align: right;">
        <span style="font-size: 15px; color: #2C2A24;">$${(item.price * item.quantity).toFixed(2)}</span>
      </td>
    </tr>
  `,
    )
    .join("");

  // Format address
  const formattedAddress = [
    shippingAddress.line1,
    shippingAddress.line2,
    `${shippingAddress.city}, ${shippingAddress.postalCode}`,
    shippingAddress.country,
  ]
    .filter(Boolean)
    .join("<br>");

  // Format date
  const formattedDate = createdAt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  await resend.emails.send({
    from: "Royals and Radiant <confirmation@confirmation.royalsandradiant.com>",
    to: storeEmail,
    subject: `New Order Received - ${orderId}`,
    html: `
      <div style="background-color: #F2F0EA; padding: 40px 20px; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2A24;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #F9F7F2; border: 1px solid #DED8CD; padding: 40px; border-radius: 4px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-family: 'Italiana', serif; font-size: 28px; font-weight: 400; margin: 0; color: #2C2A24; letter-spacing: -0.02em;">
              Royals and Radiant
            </h1>
            <p style="font-size: 12px; color: #2C2A24; opacity: 0.6; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">
              Store Order Notification
            </p>
            <div style="height: 1px; background-color: #C4A484; width: 60px; margin: 20px auto;"></div>
          </div>

          <!-- Notification Badge -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #E3F2FD; border: 1px solid #90CAF9; border-radius: 50px; padding: 8px 20px;">
              <span style="color: #1565C0; font-size: 14px; font-weight: 600;">New Order Received</span>
            </div>
          </div>

          <!-- Order Info -->
          <div style="background-color: #F2F0EA; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #9A3B3B; font-weight: 600;">Order Number:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9A3B3B; font-weight: 600;">Order Date:</td>
                <td style="padding: 6px 0; text-align: right;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9A3B3B; font-weight: 600;">Delivery Method:</td>
                <td style="padding: 6px 0; text-align: right;">${isPickup ? "Store Pickup" : "Shipping"}</td>
              </tr>
              ${couponCode ? `
              <tr>
                <td style="padding: 6px 0; color: #9A3B3B; font-weight: 600;">Coupon Used:</td>
                <td style="padding: 6px 0; text-align: right;">${couponCode}${discountAmount ? ` (-$${discountAmount.toFixed(2)})` : ""}</td>
              </tr>
              ` : ""}
            </table>
          </div>

          <!-- Customer Info -->
          <div style="background-color: #F2F0EA; border-left: 4px solid #C4A484; border-radius: 0 8px 8px 0; padding: 20px; margin-bottom: 30px;">
            <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B; margin: 0 0 12px 0;">Customer Details</h3>
            <p style="font-size: 15px; line-height: 1.8; color: #2C2A24; margin: 0;">
              <strong>Name:</strong> ${customerName}<br>
              <strong>Email:</strong> ${customerEmail}
            </p>
          </div>

          <!-- Shipping Address -->
          <div style="background-color: #F2F0EA; border-left: 4px solid #C4A484; border-radius: 0 8px 8px 0; padding: 20px; margin-bottom: 30px;">
            <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B; margin: 0 0 12px 0;">${isPickup ? "Pickup Details" : "Shipping Address"}</h3>
            <p style="font-size: 15px; line-height: 1.8; color: #2C2A24; margin: 0;">
              ${isPickup ? "Customer will pick up at store" : formattedAddress}
            </p>
          </div>

          <!-- Order Items -->
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; margin: 0 0 15px 0;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 12px 0; border-bottom: 2px solid #C4A484; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B;">Item</th>
                  <th style="padding: 12px 0; border-bottom: 2px solid #C4A484; text-align: center; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B;">Qty</th>
                  <th style="padding: 12px 0; border-bottom: 2px solid #C4A484; text-align: right; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                ${discountAmount ? `
                <tr>
                  <td colspan="2" style="padding: 10px 0; text-align: right; font-size: 14px; color: #2C2A24;">Subtotal</td>
                  <td style="padding: 10px 0; text-align: right; font-size: 14px; color: #2C2A24;">$${(totalAmount + discountAmount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 10px 0; text-align: right; font-size: 14px; color: #2C2A24;">Discount${couponCode ? ` (${couponCode})` : ""}</td>
                  <td style="padding: 10px 0; text-align: right; font-size: 14px; color: #2C2A24;">-$${discountAmount.toFixed(2)}</td>
                </tr>
                ` : ""}
                <tr>
                  <td colspan="2" style="padding: 15px 0; text-align: right; font-size: 16px; font-weight: 600; color: #2C2A24;">Total</td>
                  <td style="padding: 15px 0; text-align: right; font-size: 18px; font-weight: 700; color: #9A3B3B;">$${totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #DED8CD; text-align: center;">
            <p style="font-size: 14px; color: #2C2A24; opacity: 0.7; margin: 0;">
              This is an automated notification from your store.<br>
              Please process this order promptly.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}

type OrderShippedEmailData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  trackingNumber: string;
  trackingUrl: string;
  carrierLabel: string;
};

type StoreNotificationItem = {
  name: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
};

type StoreNotificationData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: StoreNotificationItem[];
  totalAmount: number;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
  isPickup: boolean;
  couponCode?: string | null;
  discountAmount?: number | null;
  createdAt: Date;
};

async function sendOrderShippedEmail(
  data: OrderShippedEmailData,
): Promise<void> {
  const {
    orderId,
    customerName,
    customerEmail,
    trackingNumber,
    trackingUrl,
    carrierLabel,
  } = data;

  await resend.emails.send({
    from: "Royals and Radiant <confirmation@confirmation.royalsandradiant.com>",
    to: customerEmail,
    subject: `Your Order has Shipped! - ${orderId}`,
    html: `
      <div style="background-color: #F2F0EA; padding: 40px 20px; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2A24;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #F9F7F2; border: 1px solid #DED8CD; padding: 40px; border-radius: 4px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-family: 'Italiana', serif; font-size: 28px; font-weight: 400; margin: 0; color: #2C2A24;">
              Royals and Radiant
            </h1>
            <div style="height: 1px; background-color: #C4A484; width: 60px; margin: 20px auto;"></div>
          </div>

          <h2 style="font-family: 'Italiana', serif; font-size: 22px; font-weight: 400; margin: 0 0 14px 0; color: #9A3B3B;">
            Your Order has Shipped!
          </h2>

          <p style="font-size: 16px; line-height: 1.7; margin: 0 0 18px 0;">
            Dear ${customerName},
          </p>
          <p style="font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Great news - your order is on the way.
          </p>

          <div style="background-color: #F2F0EA; border-left: 4px solid #C4A484; border-radius: 0 8px 8px 0; padding: 16px 18px; margin: 0 0 24px 0;">
            <p style="font-size: 13px; color: #9A3B3B; margin: 0 0 8px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Tracking Details</p>
            <p style="font-size: 15px; margin: 0 0 4px 0; color: #2C2A24;"><strong>Order:</strong> ${orderId}</p>
            <p style="font-size: 15px; margin: 0 0 4px 0; color: #2C2A24;"><strong>Carrier:</strong> ${carrierLabel}</p>
            <p style="font-size: 15px; margin: 0; color: #2C2A24;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
          </div>

          <p style="font-size: 15px; line-height: 1.8; margin: 0 0 18px 0; color: #2C2A24;">
            2. Tracking Your Order: Once your order is dispatched, a confirmation email will be sent containing your tracking number and a direct link to follow your package's journey. For security reasons, high-value jewelry orders may require a signature upon delivery.
          </p>

          <div style="margin: 0 0 26px 0;">
            <a href="${trackingUrl}" style="display: inline-block; background-color: #9A3B3B; color: #FFFFFF; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-size: 14px; font-weight: 600;">
              Track Your Package
            </a>
          </div>

          <p style="font-size: 13px; color: #2C2A24; opacity: 0.7; margin: 0;">
            If the button above does not work, copy and paste this link into your browser:<br>
            <a href="${trackingUrl}" style="color: #9A3B3B;">${trackingUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}

export async function markOrderShipped(
  orderId: string,
  trackingNumber: string,
) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  const normalizedOrderId = orderId.trim();
  const normalizedTrackingNumber = trackingNumber.trim();

  if (!normalizedOrderId) {
    return { success: false, error: "Order ID is required." };
  }

  if (!normalizedTrackingNumber) {
    return { success: false, error: "Tracking number is required." };
  }

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: normalizedOrderId },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        status: true,
        trackingNumber: true,
      },
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    if (
      existingOrder.status === "SHIPPED" &&
      existingOrder.trackingNumber === normalizedTrackingNumber
    ) {
      return { success: true, message: "Order is already marked as shipped." };
    }

    const trackingDetails = buildTrackingLink(normalizedTrackingNumber);

    const updatedOrder = await prisma.order.update({
      where: { id: normalizedOrderId },
      data: {
        status: "SHIPPED",
        trackingNumber: trackingDetails.trackingNumber,
      },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
      },
    });

    let warning: string | undefined;
    try {
      await sendOrderShippedEmail({
        orderId: updatedOrder.id,
        customerName: updatedOrder.customerName,
        customerEmail: updatedOrder.customerEmail,
        trackingNumber: trackingDetails.trackingNumber,
        trackingUrl: trackingDetails.trackingUrl,
        carrierLabel: trackingDetails.carrierLabel,
      });
    } catch (emailError) {
      console.error("Failed to send shipped email:", emailError);
      warning = "Order updated, but shipping email could not be sent.";
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    if (warning) {
      return { success: true, warning };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to mark order as shipped:", error);
    return { success: false, error: "Failed to mark order as shipped." };
  }
}

export async function updateTrackingNumber(orderId: string, trackingNumber: string) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  const normalizedOrderId = orderId.trim();
  const normalizedTrackingNumber = trackingNumber.trim();

  if (!normalizedOrderId) {
    return { success: false, error: "Order ID is required." };
  }

  if (!normalizedTrackingNumber) {
    return { success: false, error: "Tracking number is required." };
  }

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: normalizedOrderId },
      select: {
        id: true,
        status: true,
        customerName: true,
        customerEmail: true,
      },
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    if (existingOrder.status !== "SHIPPED") {
      return { success: false, error: "Order must be shipped before updating tracking." };
    }

    const trackingDetails = buildTrackingLink(normalizedTrackingNumber);

    await prisma.order.update({
      where: { id: normalizedOrderId },
      data: {
        trackingNumber: trackingDetails.trackingNumber,
      },
    });

    // Send email notification about updated tracking
    let warning: string | undefined;
    try {
      await sendOrderShippedEmail({
        orderId: existingOrder.id,
        customerName: existingOrder.customerName,
        customerEmail: existingOrder.customerEmail,
        trackingNumber: trackingDetails.trackingNumber,
        trackingUrl: trackingDetails.trackingUrl,
        carrierLabel: trackingDetails.carrierLabel,
      });
    } catch (emailError) {
      console.error("Failed to send tracking update email:", emailError);
      warning = "Tracking updated, but notification email could not be sent.";
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    if (warning) {
      return { success: true, warning };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update tracking number:", error);
    return { success: false, error: "Failed to update tracking number." };
  }
}

function isStripeCheckoutSessionNonProductLine(
  line: Stripe.LineItem,
): boolean {
  const desc = line.description ?? "";
  if (desc === "Shipping & Handling") return true;
  if (desc.startsWith("Discount:")) return true;
  if (/^tax\b/i.test(desc)) return true;
  return false;
}

function stripeProductLineItemsForFulfillment(
  allLines: Stripe.LineItem[],
  productCount: number,
): Stripe.LineItem[] {
  const productLines = allLines.filter(
    (li) => !isStripeCheckoutSessionNonProductLine(li),
  );
  return productLines.slice(0, productCount);
}

/** Webhook + success-page sync: single code path (see stripe-recommendations). */
async function fulfillCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const metadata = session.metadata;

  if (!metadata?.items) {
    throw new Error("Missing metadata in session");
  }

  let parsedItemsJson: unknown;
  try {
    parsedItemsJson = JSON.parse(metadata.items);
  } catch (parseError) {
    console.error("Failed to parse Stripe items metadata:", parseError);
    throw new Error("Invalid metadata.items payload");
  }

  const itemsParse = z
    .array(StripeWebhookMetadataItemSchema)
    .safeParse(parsedItemsJson);
  if (!itemsParse.success) {
    console.error("Stripe metadata.items validation:", itemsParse.error);
    throw new Error("Invalid metadata.items shape");
  }
  const metadataItems = itemsParse.data;

  const stripeLineItems = await stripe.checkout.sessions.listLineItems(
    session.id,
    {
      limit: 100,
    },
  );

  const productStripeLines = stripeProductLineItemsForFulfillment(
    stripeLineItems.data,
    metadataItems.length,
  );

  const mappedItems = metadataItems.map((item, index) => {
    const lineItem = productStripeLines[index];
    const quantity = Number(lineItem?.quantity ?? item.quantity ?? 1);
    const unitAmount = lineItem?.price?.unit_amount;

    return {
      productId: item.originalProductId || item.id,
      quantity,
      price: unitAmount != null ? unitAmount / 100 : item.price,
      comboId: item.comboId || null,
      color: item.color || null,
      size: item.size || null,
      name: item.name || null,
    };
  });

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id || null;

  const customerEmailFromCustomer =
    typeof session.customer === "object" &&
    session.customer &&
    "email" in session.customer &&
    typeof session.customer.email === "string"
      ? session.customer.email
      : "";

  const customerEmail =
    session.customer_details?.email ||
    session.customer_email ||
    customerEmailFromCustomer ||
    "";
  const stripeShippingDetails =
    session.collected_information?.shipping_details;
  const customerName =
    metadata.customerName ||
    session.customer_details?.name ||
    stripeShippingDetails?.name ||
    "";

  const stripeAddress =
    stripeShippingDetails?.address || session.customer_details?.address;
  const isPickup = metadata.isPickup === "true";
  const shippingAddress = {
    name: customerName || null,
    line1: (stripeAddress?.line1 || metadata.addressLine1 || "").trim(),
    line2: stripeAddress?.line2 || metadata.addressLine2 || "" || null,
    city: (stripeAddress?.city || metadata.city || "").trim(),
    state: stripeAddress?.state || null,
    postalCode: (
      stripeAddress?.postal_code ||
      metadata.postalCode ||
      ""
    ).trim(),
    country: (stripeAddress?.country || metadata.country || "").trim(),
    isPickup,
  };

  const orderAddress = {
    line1: shippingAddress.line1 || (isPickup ? "STORE PICKUP" : ""),
    line2: shippingAddress.line2,
    city: shippingAddress.city || (isPickup ? "PICKUP" : ""),
    postalCode: shippingAddress.postalCode || (isPickup ? "PICKUP" : ""),
    country: shippingAddress.country || "US",
  };

  const orderId = metadata.orderId || `ORD-${session.id}`;
  const totalAmount = (session.amount_total || 0) / 100;
  const couponCode = metadata.couponCode || null;
  const discountAmount = metadata.discountAmount
    ? parseFloat(metadata.discountAmount)
    : 0;

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  const isNewOrder = !existingOrder;

  const order = await prisma.order.upsert({
    where: { id: orderId },
    update: {
      customerName,
      customerEmail,
      addressLine1: orderAddress.line1,
      addressLine2: orderAddress.line2,
      city: orderAddress.city,
      postalCode: orderAddress.postalCode,
      country: orderAddress.country,
      shippingAddress: shippingAddress as Prisma.InputJsonValue,
      totalAmount,
      paymentIntentId,
      paymentId: paymentIntentId,
      stripeCustomerId,
      couponCode,
      discountAmount,
      isPickup,
      items: {
        deleteMany: {},
        create: mappedItems.map(
          ({ productId, quantity, price, comboId, color, size }) => ({
            productId,
            quantity,
            price,
            comboId,
            color,
            size,
          }),
        ),
      },
    },
    create: {
      id: orderId,
      customerName,
      customerEmail,
      addressLine1: orderAddress.line1,
      addressLine2: orderAddress.line2,
      city: orderAddress.city,
      postalCode: orderAddress.postalCode,
      country: orderAddress.country,
      shippingAddress: shippingAddress as Prisma.InputJsonValue,
      totalAmount,
      paymentIntentId,
      paymentId: paymentIntentId,
      stripeCustomerId,
      status: "PENDING",
      couponCode,
      discountAmount,
      isPickup,
      items: {
        create: mappedItems.map(
          ({ productId, quantity, price, comboId, color, size }) => ({
            productId,
            quantity,
            price,
            comboId,
            color,
            size,
          }),
        ),
      },
    },
  });

  if (isNewOrder) {
    for (const item of mappedItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    let emailItems: OrderConfirmationItem[] = [];
    if (mappedItems[0]?.name) {
      emailItems = mappedItems.map((item) => ({
        name: item.name || "Item",
        quantity: item.quantity,
        price: item.price,
        size: item.size,
      }));
    } else {
      const products = await prisma.product.findMany({
        where: { id: { in: mappedItems.map((item) => item.productId) } },
        select: { id: true, name: true },
      });
      const productMap = new Map<string, string>(
        products.map((product: { id: string; name: string }) => [
          product.id,
          product.name,
        ]),
      );
      emailItems = mappedItems.map((item) => ({
        name: productMap.get(item.productId) ?? "Item",
        quantity: item.quantity,
        price: item.price,
        size: item.size,
      }));
    }

    try {
      await sendOrderConfirmationEmail({
        orderId: order.id,
        customerName,
        customerEmail,
        items: emailItems,
        totalAmount,
        shippingAddress: {
          line1: orderAddress.line1,
          line2: orderAddress.line2,
          city: orderAddress.city,
          postalCode: orderAddress.postalCode,
          country: orderAddress.country,
        },
        isPickup,
      });
      console.log(
        "Order confirmation email sent successfully to:",
        customerEmail,
      );
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }

    try {
      const storeEmailItems: StoreNotificationItem[] = mappedItems.map(
        (item) => ({
          name:
            item.name ||
            emailItems.find((ei) => ei.name === item.name)?.name ||
            "Item",
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
        }),
      );

      await sendStoreOrderNotificationEmail({
        orderId: order.id,
        customerName,
        customerEmail,
        items: storeEmailItems,
        totalAmount,
        shippingAddress: {
          line1: orderAddress.line1,
          line2: orderAddress.line2,
          city: orderAddress.city,
          postalCode: orderAddress.postalCode,
          country: orderAddress.country,
        },
        isPickup,
        couponCode,
        discountAmount: discountAmount ?? null,
        createdAt: new Date(),
      });
      console.log("Store notification email sent successfully");
    } catch (storeEmailError) {
      console.error(
        "Failed to send store notification email:",
        storeEmailError,
      );
    }
  } else {
    console.log(
      `Order ${order.id} already exists; skipped duplicate stock/email side effects.`,
    );
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function handleStripeWebhook(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await fulfillCheckoutSessionCompleted(session);
    }

    return { received: true };
  } catch (error) {
    console.error("Webhook error:", error);
    throw error;
  }
}

// Combo Settings Actions
export async function updateComboSettings(
  comboDiscount2: number,
  comboDiscount3: number,
) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  try {
    if (!prisma.settings) {
      console.warn("prisma.settings is undefined.");
      return { success: false, error: "Prisma client is outdated." };
    }

    await prisma.settings.upsert({
      where: { id: "global" },
      update: { comboDiscount2, comboDiscount3 },
      create: { id: "global", comboDiscount2, comboDiscount3 },
    });

    revalidatePath("/admin");
    revalidatePath("/combos");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to update combo settings." };
  }
}

export async function updateStoreSettings(data: {
  comboDiscount2?: number;
  comboDiscount3?: number;
  estimatedDeliveryMin?: number;
  estimatedDeliveryMax?: number;
  allowStorePickup?: boolean;
  pickupAddress?: string | null;
}) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  try {
    await prisma.settings.upsert({
      where: { id: "global" },
      update: data,
      create: {
        id: "global",
        comboDiscount2: data.comboDiscount2 ?? 10,
        comboDiscount3: data.comboDiscount3 ?? 15,
        estimatedDeliveryMin: data.estimatedDeliveryMin ?? 2,
        estimatedDeliveryMax: data.estimatedDeliveryMax ?? 4,
        allowStorePickup: data.allowStorePickup ?? false,
        pickupAddress: data.pickupAddress ?? null,
      },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/checkout");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to update store settings." };
  }
}

export async function createShippingRule(
  category: ShippingCategory,
  minAmount: number,
  price: number,
  maxAmount?: number | null,
) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  try {
    if (Number.isNaN(minAmount) || Number.isNaN(price)) {
      return { success: false, error: "Please enter valid numeric values." };
    }
    if (
      maxAmount !== null &&
      maxAmount !== undefined &&
      Number.isNaN(maxAmount)
    ) {
      return {
        success: false,
        error: "Please enter a valid maximum order amount.",
      };
    }
    if (
      maxAmount !== null &&
      maxAmount !== undefined &&
      maxAmount < minAmount
    ) {
      return {
        success: false,
        error:
          "Maximum order amount must be greater than or equal to minimum amount.",
      };
    }

    const normalizedCategory = normalizeShippingCategoryInput(category);

    const rule = await prisma.shippingRule.create({
      data: {
        category: normalizedCategory,
        minAmount,
        price,
        maxAmount: maxAmount ?? null,
      } as Prisma.ShippingRuleCreateInput,
    });
    revalidatePath("/admin/settings");
    return {
      success: true,
      rule: {
        ...rule,
        category: normalizedCategory,
        minAmount: Number(rule.minAmount),
        maxAmount: rule.maxAmount ? Number(rule.maxAmount) : null,
        price: Number(rule.price),
      },
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to create shipping rule." };
  }
}

export async function deleteShippingRule(id: string) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  try {
    await prisma.shippingRule.delete({ where: { id } });
    revalidatePath("/admin/settings");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to delete shipping rule." };
  }
}

export async function createHeroImage(formData: FormData) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  const imageFiles = formData.getAll("image") as File[];
  const altText = formData.get("altText") as string;
  const viewport = normalizeHeroViewportInput(
    formData.get("viewport") as string | null,
  );
  const sortOrderBase = parseInt((formData.get("sortOrder") as string) || "0");

  if (
    imageFiles.length === 0 ||
    (imageFiles.length === 1 && imageFiles[0].size === 0)
  ) {
    return { success: false, error: "At least one image is required" };
  }

  try {
    const createdImages = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      if (imageFile.size === 0) continue;

      const imageUrl = await uploadImageAsWebp(imageFile, "hero");

      const image = await prisma.heroImage.create({
        data: {
          imageUrl,
          altText,
          viewport,
          sortOrder: sortOrderBase + i,
        } as Prisma.HeroImageCreateInput,
      });
      createdImages.push(image);
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true, images: createdImages };
  } catch (error) {
    console.error("Error creating hero image:", error);
    return { success: false, error: "Failed to upload hero images." };
  }
}

export async function deleteHeroImage(id: string) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  try {
    // Get hero image URL before deletion
    const heroImage = await prisma.heroImage.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    await prisma.heroImage.delete({ where: { id } });

    // Delete the blob image
    await deleteBlobs(heroImage?.imageUrl);

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to delete hero image." };
  }
}

export async function updateHeroImageViewport(
  id: string,
  viewport: HeroViewport,
) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  try {
    const normalizedViewport = normalizeHeroViewportInput(viewport);
    const image = await prisma.heroImage.update({
      where: { id },
      data: { viewport: normalizedViewport } as Prisma.HeroImageUpdateInput,
    });
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return {
      success: true,
      image: {
        ...image,
        viewport: normalizedViewport,
      },
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to update hero image viewport." };
  }
}

export async function reorderHeroImages(
  orderedIds: { id: string; sortOrder: number }[],
) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  try {
    await prisma.$transaction(
      orderedIds.map(({ id, sortOrder }) =>
        prisma.heroImage.update({
          where: { id },
          data: { sortOrder },
        }),
      ),
    );
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to reorder hero images." };
  }
}

export async function uploadVariantImage(formData: FormData) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  const file = formData.get("image") as File;
  if (!file || file.size === 0) return { success: false, error: "No file" };

  try {
    const url = await uploadImageAsWebp(file, "variants");
    return { success: true, url };
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof ImageUploadValidationError ? e.message : "Upload failed",
    };
  }
}

// Coupon Actions
export async function createCoupon(formData: FormData) {
  if (!(await requireAdminSession())) {
    return {
      success: false,
      error: "Unauthorized.",
    };
  }
  const code = (formData.get("code") as string).toUpperCase();
  const discountType = formData.get("discountType") as "PERCENTAGE" | "FIXED";
  const discountValue = parseFloat(formData.get("discountValue") as string);
  const minOrderAmount = formData.get("minOrderAmount")
    ? parseFloat(formData.get("minOrderAmount") as string)
    : null;

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue,
        minOrderAmount,
      },
    });
    revalidatePath("/admin/settings");
    return {
      success: true,
      coupon: {
        ...coupon,
        discountType: coupon.discountType as "PERCENTAGE" | "FIXED",
        discountValue: Number(coupon.discountValue),
        minOrderAmount: coupon.minOrderAmount
          ? Number(coupon.minOrderAmount)
          : null,
      },
    };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      success: false,
      error: "Failed to create coupon. Code might already exist.",
    };
  }
}

export async function deleteCoupon(id: string) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Unauthorized." };
  }
  try {
    await prisma.coupon.delete({ where: { id } });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to delete coupon." };
  }
}

export async function validateCoupon(code: string, orderAmount: number) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase(), isActive: true },
    });

    if (!coupon) {
      return { success: false, error: "Invalid or expired coupon code." };
    }

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      return {
        success: false,
        error: `Minimum order amount of $${coupon.minOrderAmount} required.`,
      };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { success: false, error: "This coupon has expired." };
    }

    return {
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType as "PERCENTAGE" | "FIXED",
        discountValue: Number(coupon.discountValue),
      },
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to validate coupon." };
  }
}
