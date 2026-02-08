'use server';

import { prisma } from './prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
import Stripe from 'stripe';

import type { State, CategoryState } from './definitions';
import { slugify, buildSlugPath, getBaseUrl } from './utils';

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

// ===================
// Category Schemas
// ===================

const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
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
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/categories');
  revalidatePath('/products/category', 'layout');
}

export async function createCategory(_prevState: CategoryState, formData: FormData): Promise<CategoryState> {
  const parentId = formData.get('parentId') as string | null;
  const isVisibleValue = formData.get('isVisible') === 'on' || formData.get('isVisible') === 'true';
  
  // Auto-generate slug from name if not provided
  const nameValue = formData.get('name') as string;
  let slugValue = formData.get('slug') as string;
  if (!slugValue && nameValue) {
    slugValue = slugify(nameValue);
  }

  const validatedFields = CreateCategory.safeParse({
    name: nameValue,
    slug: slugValue,
    description: formData.get('description') || undefined,
    parentId: parentId || null,
    isVisible: isVisibleValue,
    sortOrder: formData.get('sortOrder') || 0,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Category.',
    };
  }

  const { name, slug, description, isVisible, sortOrder } = validatedFields.data;

  // Get parent's slugPath if there's a parent
  let parentSlugPath: string | null = null;
  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: { slugPath: true },
    });
    if (!parent) {
      return { message: 'Parent category not found.' };
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
      errors: { slug: ['A category with this slug already exists at this level.'] },
      message: 'Duplicate slug.',
    };
  }

  // Handle image upload
  let imageUrl: string | null = null;
  const imageFile = formData.get('image') as File | null;
  if (imageFile && imageFile.size > 0) {
    const fileName = `categories/${randomUUID()}-${imageFile.name}`;
    try {
      const blob = await put(fileName, imageFile, { access: 'public' });
      imageUrl = blob.url;
    } catch (e) {
      console.error("Upload error", e);
      return { message: 'Image upload failed.' };
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
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to Create Category.' };
  }

  await revalidateCategoryPaths();
  redirect('/admin/categories');
}

export async function updateCategory(id: string, _prevState: CategoryState, formData: FormData): Promise<CategoryState> {
  const parentId = formData.get('parentId') as string | null;
  const isVisibleValue = formData.get('isVisible') === 'on' || formData.get('isVisible') === 'true';
  
  const nameValue = formData.get('name') as string;
  let slugValue = formData.get('slug') as string;
  if (!slugValue && nameValue) {
    slugValue = slugify(nameValue);
  }

  const validatedFields = UpdateCategory.safeParse({
    name: nameValue,
    slug: slugValue,
    description: formData.get('description') || undefined,
    parentId: parentId || null,
    isVisible: isVisibleValue,
    sortOrder: formData.get('sortOrder') || 0,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Category.',
    };
  }

  const { name, slug, description, isVisible, sortOrder } = validatedFields.data;

  // Get current category
  const currentCategory = await prisma.category.findUnique({
    where: { id },
    include: { children: true },
  });

  if (!currentCategory) {
    return { message: 'Category not found.' };
  }

  // Prevent setting self as parent
  if (parentId === id) {
    return { message: 'A category cannot be its own parent.' };
  }

  // Get parent's slugPath
  let parentSlugPath: string | null = null;
  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: { slugPath: true },
    });
    if (!parent) {
      return { message: 'Parent category not found.' };
    }
    parentSlugPath = parent.slugPath;
    
    // Prevent circular reference
    if (parent.slugPath.startsWith(currentCategory.slugPath)) {
      return { message: 'Cannot move a category under its own descendant.' };
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
      errors: { slug: ['A category with this slug already exists at this level.'] },
      message: 'Duplicate slug.',
    };
  }

  // Handle image upload
  let imageUrl: string | undefined = undefined;
  const imageFile = formData.get('image') as File | null;
  if (imageFile && imageFile.size > 0) {
    const fileName = `categories/${randomUUID()}-${imageFile.name}`;
    try {
      const blob = await put(fileName, imageFile, { access: 'public' });
      imageUrl = blob.url;
    } catch (e) {
      console.error("Upload error", e);
      return { message: 'Image upload failed.' };
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
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to Update Category.' };
  }

  await revalidateCategoryPaths();
  redirect('/admin/categories');
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check for children
    const childCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      return {
        success: false,
        message: 'Cannot delete a category that has subcategories. Move or delete them first.',
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

    await prisma.category.delete({
      where: { id },
    });

    await revalidateCategoryPaths();
    return { success: true, message: 'Category deleted successfully.' };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, message: 'Database Error: Failed to Delete Category.' };
  }
}

export async function reorderCategories(
  orderedIds: { id: string; sortOrder: number }[]
): Promise<{ success: boolean; message: string }> {
  try {
    // Update all categories in a transaction
    await prisma.$transaction(
      orderedIds.map(({ id, sortOrder }) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder },
        })
      )
    );

    await revalidateCategoryPaths();
    return { success: true, message: 'Categories reordered successfully.' };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, message: 'Database Error: Failed to reorder categories.' };
  }
}

// ===================
// Product Schemas
// ===================

const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().gt(0, 'Price must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  stock: z.coerce.number().min(0, 'Stock must be 0 or greater'),
  isOnSale: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  salePrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().positive('Sale price must be positive').nullable()
  ),
  salePercentage: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().min(0, 'Percentage must be at least 0').max(100, 'Percentage cannot exceed 100').nullable()
  ),
  isCombo: z.boolean().default(false),
  sizeChartUrl: z.string().optional().nullable(),
});

const CreateProduct = ProductSchema.omit({ id: true });
const UpdateProduct = ProductSchema.omit({ id: true });

export async function createProduct(_prevState: State, formData: FormData) {
  const isOnSaleValue = formData.get('isOnSale') === 'on';
  const isFeaturedValue = formData.get('isFeatured') === 'on';
  const isComboValue = formData.get('isCombo') === 'on';
  const salePriceValue = formData.get('salePrice');
  const salePercentageValue = formData.get('salePercentage');
  
  const validatedFields = CreateProduct.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    categoryId: formData.get('categoryId'),
    stock: formData.get('stock'),
    isOnSale: isOnSaleValue,
    isFeatured: isFeaturedValue,
    salePrice: isOnSaleValue && salePriceValue ? salePriceValue : null,
    salePercentage: isOnSaleValue && salePercentageValue ? salePercentageValue : null,
    isCombo: isComboValue,
    sizeChartUrl: formData.get('existingSizeChartUrl') as string || null,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Product.',
    };
  }

  const { name, description, price, categoryId, stock, isOnSale, isFeatured, salePrice, salePercentage, isCombo } = validatedFields.data;
  let { sizeChartUrl } = validatedFields.data;
  
  // Handle size chart upload
  const sizeChartFile = formData.get('sizeChart') as File | null;
  if (sizeChartFile && sizeChartFile.size > 0) {
    const fileName = `size-charts/${randomUUID()}-${sizeChartFile.name}`;
    try {
      const blob = await put(fileName, sizeChartFile, { access: 'public' });
      sizeChartUrl = blob.url;
    } catch (e) {
      console.error("Size chart upload error", e);
      return { message: 'Size chart upload failed.' };
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
      errors: { categoryId: ['Selected category does not exist.'] },
      message: 'Invalid category.',
    };
  }
  
  const imageFiles = formData.getAll('images') as File[];
  let images: string[] = [];

  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
    for (const file of imageFiles) {
      if (file.size > 0) {
        const fileName = `${randomUUID()}-${file.name}`;
        try {
          const blob = await put(fileName, file, {
            access: 'public',
          });
          images.push(blob.url);
        } catch (e) {
          console.error("Upload error", e);
          return { message: 'Image upload failed.' };
        }
      }
    }
  } else {
     return { message: 'At least one image is required.' };
  }

  try {
    const product = await prisma.product.create({
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
        sizeChartUrl,
        images,
        variants: {
          create: JSON.parse(formData.get('variantsJson') as string || '[]').map((v: any) => ({
            colorName: v.colorName,
            hexCode: v.hexCode,
            price: v.price ? parseFloat(v.price) : null,
            stock: parseInt(v.stock || '0'),
            imageUrl: v.imageUrl || null,
            images: v.images || [],
          })),
        },
      },
    });
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to Create Product.' };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/sale');
  revalidatePath('/combos');
  revalidatePath('/products/category', 'layout');
  redirect('/admin');
}

export async function updateProduct(id: string, _prevState: State, formData: FormData) {
  const isOnSaleValue = formData.get('isOnSale') === 'on';
  const isFeaturedValue = formData.get('isFeatured') === 'on';
  const isComboValue = formData.get('isCombo') === 'on';
  const salePriceValue = formData.get('salePrice');
  const salePercentageValue = formData.get('salePercentage');
  
  const validatedFields = UpdateProduct.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    categoryId: formData.get('categoryId'),
    stock: formData.get('stock'),
    isOnSale: isOnSaleValue,
    isFeatured: isFeaturedValue,
    salePrice: isOnSaleValue && salePriceValue ? salePriceValue : null,
    salePercentage: isOnSaleValue && salePercentageValue ? salePercentageValue : null,
    isCombo: isComboValue,
    sizeChartUrl: formData.get('existingSizeChartUrl') as string || null,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Product.',
    };
  }

  const { name, description, price, categoryId, stock, isOnSale, isFeatured, salePrice, salePercentage, isCombo } = validatedFields.data;
  let { sizeChartUrl } = validatedFields.data;

  // Handle size chart upload
  const sizeChartFile = formData.get('sizeChart') as File | null;
  if (sizeChartFile && sizeChartFile.size > 0) {
    const fileName = `size-charts/${randomUUID()}-${sizeChartFile.name}`;
    try {
      const blob = await put(fileName, sizeChartFile, { access: 'public' });
      sizeChartUrl = blob.url;
    } catch (e) {
      console.error("Size chart upload error", e);
      return { message: 'Size chart upload failed.' };
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
      errors: { categoryId: ['Selected category does not exist.'] },
      message: 'Invalid category.',
    };
  }
  
  // Get existing images from form data
  const existingImages = formData.getAll('existingImages') as string[];
  
  const imageFiles = formData.getAll('images') as File[];
  let newImages: string[] = [];

  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
    for (const file of imageFiles) {
      if (file.size > 0) {
        const fileName = `${randomUUID()}-${file.name}`;
        try {
          const blob = await put(fileName, file, {
            access: 'public',
          });
          newImages.push(blob.url);
        } catch (e) {
          console.error("Upload error", e);
          return { message: 'Image upload failed.' };
        }
      }
    }
  }

  const images = [...existingImages, ...newImages];

  if (images.length === 0) {
    return { message: 'At least one image is required.' };
  }

  try {
    const variants = JSON.parse(formData.get('variantsJson') as string || '[]');

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
          sizeChartUrl,
          images,
          variants: {
            create: variants.map((v: any) => ({
              colorName: v.colorName,
              hexCode: v.hexCode,
              price: v.price ? parseFloat(v.price) : null,
              stock: parseInt(v.stock || '0'),
              imageUrl: v.imageUrl || null,
              images: v.images || [],
            })),
          },
        },
      }),
    ]);
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to Update Product.' };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/sale');
  revalidatePath('/combos');
  revalidatePath('/products/category', 'layout');
  redirect('/admin');
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });
    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath('/sale');
    revalidatePath('/products/category', 'layout');
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Database Error: Failed to Delete Product.');
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
  const results: BulkProductResult[] = [];
  
  // Parse the products JSON from form data
  const productsJson = formData.get('products') as string;
  let products: Array<{
    name: string;
    description: string;
    price: number;
    categoryId: string;
    stock: number;
    isOnSale: boolean;
    isFeatured?: boolean;
    salePrice?: number;
    salePercentage?: number;
    imageFileNames: string[];
  }>;

  try {
    products = JSON.parse(productsJson);
  } catch {
    return { success: false, results: [], message: 'Invalid product data format.' };
  }

  if (!products || products.length === 0) {
    return { success: false, results: [], message: 'No products to create.' };
  }

  // Get all uploaded images
  const imageFiles: Map<string, File> = new Map();
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('image_') && value instanceof File && value.size > 0) {
      imageFiles.set(value.name, value);
    }
  }

  // Process each product
  for (const product of products) {
    const productResult: BulkProductResult = { success: false, name: product.name };

    // Validate product data
    const validatedFields = CreateProduct.safeParse({
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId,
      stock: product.stock,
      isOnSale: product.isOnSale || false,
      isFeatured: product.isFeatured || false,
      salePrice: product.isOnSale ? (product.salePrice ?? null) : null,
      salePercentage: product.isOnSale ? (product.salePercentage ?? null) : null,
    });

    if (!validatedFields.success) {
      productResult.error = 'Validation failed: ' + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(', ');
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
        const uniqueFileName = `${randomUUID()}-${imageFile.name}`;
        const blob = await put(uniqueFileName, imageFile, {
          access: 'public',
        });
        productImages.push(blob.url);
      } catch (e) {
        console.error('Upload error', e);
        productResult.error = 'Image upload failed';
        uploadError = true;
        break;
      }
    }

    if (uploadError) {
      results.push(productResult);
      continue;
    }

    if (productImages.length === 0) {
      productResult.error = 'No images provided';
      results.push(productResult);
      continue;
    }

    // Create product in database
    try {
      const { name, description, price, categoryId, stock, isOnSale, isFeatured, salePrice, salePercentage } = validatedFields.data;
      
      // Calculate sale price if percentage is provided
      let finalSalePrice = salePrice;
      if (isOnSale && salePercentage !== null) {
        finalSalePrice = price * (1 - salePercentage / 100);
      }
      
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
          images: productImages,
        },
      });
      productResult.success = true;
    } catch (error) {
      console.error('Database error', error);
      productResult.error = 'Database error';
    }

    results.push(productResult);
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/sale');
  revalidatePath('/products/category', 'layout');

  return {
    success: failCount === 0,
    results,
    message: `Created ${successCount} products successfully${failCount > 0 ? `, ${failCount} failed` : ''}.`,
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
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number(),
    price: z.number()
  }))
});

export async function createOrder(data: z.infer<typeof OrderSchema>) {
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
        status: 'COMPLETED',
        items: {
          create: orderData.items.map(item => ({
             productId: item.id,
             quantity: item.quantity,
             price: item.price
          }))
        }
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Order creation failed", error);
    return { success: false, error: "Database Error" };
  }
}

// Contact form schema
const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
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
  formData: FormData
): Promise<ContactFormState> {
  // Honeypot check
  const website = formData.get('b_website');
  const formTs = formData.get('form_ts');
  const currentTime = Date.now();
  
  // If honeypot is filled OR form was submitted in less than 3 seconds
  if (website || (formTs && currentTime - Number(formTs) < 3000)) {
    console.warn('Bot detected: Honeypot or fast submission.');
    return {
      success: true,
      message: 'Thank you! Your message has been sent successfully.',
    };
  }

  const validatedFields = ContactFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please fix the errors above.',
    };
  }

  const { name, email, subject, message } = validatedFields.data;

  try {
    // Send email to the store owner
    await resend.emails.send({
      from: 'Royals and Radiant <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL || '',
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
                <span style="font-size: 16px;">${name}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; display: block; margin-bottom: 4px;">Email</span>
                <span style="font-size: 16px;">${email}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; display: block; margin-bottom: 4px;">Subject</span>
                <span style="font-size: 16px;">${subject}</span>
              </div>
            </div>

            <div style="padding: 25px; background-color: #F2F0EA; border-left: 4px solid #9A3B3B; border-radius: 0 4px 4px 0;">
              <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; display: block; margin-bottom: 10px;">Message</span>
              <div style="font-size: 15px; line-height: 1.6; color: #2C2A24;">${message.replace(/\n/g, '<br>')}</div>
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
      from: 'Royals and Radiant <onboarding@resend.dev>',
      to: email,
      subject: 'Thank you for contacting Royals and Radiant',
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
              Dear ${name},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              We have received your message and will get back to you within 24 hours. Where tradition meets modern elegance, we are honored to be part of your unique journey.
            </p>

            <div style="padding: 25px; background-color: #F2F0EA; border-left: 4px solid #C4A484; border-radius: 0 4px 4px 0;">
              <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B; display: block; margin-bottom: 10px;">Your Message Copy</span>
              <div style="font-size: 14px; line-height: 1.6; color: #2C2A24; opacity: 0.8;">
                <strong>Subject:</strong> ${subject}<br><br>
                ${message.replace(/\n/g, '<br>')}
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
      message: 'Thank you! Your message has been sent successfully.',
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      message: 'Failed to send message. Please try again later.',
    };
  }
}

// Fetch order by Stripe session ID
export async function getOrderBySessionId(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session.payment_intent) {
      return null;
    }
    
    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: {
        paymentId: session.payment_intent as string,
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
      return null;
    }
    
    return {
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item: { product: { name: string }; quantity: number; price: unknown }) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      shippingAddress: {
        line1: order.addressLine1,
        line2: order.addressLine2,
        city: order.city,
        postalCode: order.postalCode,
        country: order.country,
      },
    };
  } catch (error) {
    console.error('Error fetching order by session ID:', error);
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
  coupon?: { code: string; discountAmount: number },
  isPickup: boolean = false
): Promise<{ url: string | null; error?: string }> {
  try {
    // Get base URL with fallback for local development
    const appUrl = getBaseUrl();
    if (!appUrl) {
      return { url: null, error: 'Base URL is not set' };
    }

    // Find existing customer or create new one to pre-fill Stripe checkout
    let customerId: string | undefined;
    const existingCustomers = await stripe.customers.list({
      email: shippingInfo.customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      // Update existing customer with new shipping info
      const customer = await stripe.customers.update(existingCustomers.data[0].id, {
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

    const lineItems: any[] = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.images && item.images.length > 0 ? [item.images[0]] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects cents
      },
      quantity: item.quantity,
    }));

    // Add Shipping Line Item (Feature 5)
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping & Handling',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Add Coupon as a negative line item if Stripe Coupons aren't used directly
    // Alternatively, we could create a Stripe Coupon on the fly, but negative line item is simpler for one-off discounts
    if (coupon && coupon.discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Discount: ${coupon.code}`,
          },
          unit_amount: -Math.round(coupon.discountAmount * 100),
        },
        quantity: 1,
      });
    }

    const orderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Include combo information in metadata
    const itemsMetadata = items.map(i => ({ 
      id: i.id, 
      quantity: i.quantity, 
      price: i.price, 
      name: i.name,
      comboId: i.comboId || null,
      originalProductId: i.originalProductId || null,
      color: i.color || null,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      customer: customerId,
      payment_intent_data: {
        metadata: {
          orderId: orderId,
          customerName: shippingInfo.customerName,
          addressLine1: shippingInfo.addressLine1,
          addressLine2: shippingInfo.addressLine2 || '',
          city: shippingInfo.city,
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country,
          items: JSON.stringify(itemsMetadata),
          couponCode: coupon?.code || '',
          discountAmount: coupon?.discountAmount.toString() || '0',
          isPickup: isPickup ? 'true' : 'false',
        },
      },
      metadata: {
        orderId: orderId,
        customerName: shippingInfo.customerName,
        addressLine1: shippingInfo.addressLine1,
        addressLine2: shippingInfo.addressLine2 || '',
        city: shippingInfo.city,
        postalCode: shippingInfo.postalCode,
        country: shippingInfo.country,
        items: JSON.stringify(itemsMetadata),
        couponCode: coupon?.code || '',
        discountAmount: coupon?.discountAmount.toString() || '0',
        isPickup: isPickup ? 'true' : 'false',
      },
      ...(!isPickup && {
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'IN'],
        },
      }),
    });

    return { url: session.url };
  } catch (error) {
    console.error('Stripe session error:', error);
    return { url: null, error: 'Failed to create checkout session' };
  }
}

// Order Confirmation Email Types
type OrderConfirmationItem = {
  name: string;
  quantity: number;
  price: number;
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
};

async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<void> {
  const { orderId, customerName, customerEmail, items, totalAmount, shippingAddress } = data;
  
  // Generate items HTML
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #DED8CD;">
        <span style="font-size: 15px; color: #2C2A24;">${item.name}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #DED8CD; text-align: center;">
        <span style="font-size: 15px; color: #2C2A24;">${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #DED8CD; text-align: right;">
        <span style="font-size: 15px; color: #2C2A24;">$${(item.price * item.quantity).toFixed(2)}</span>
      </td>
    </tr>
  `).join('');

  // Format address
  const formattedAddress = [
    shippingAddress.line1,
    shippingAddress.line2,
    `${shippingAddress.city}, ${shippingAddress.postalCode}`,
    shippingAddress.country,
  ].filter(Boolean).join('<br>');

  await resend.emails.send({
    from: 'Royals and Radiant <confirmation@confirmation.royalsandradiant.com>',
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

          <!-- Shipping Address -->
          <div style="background-color: #F2F0EA; border-left: 4px solid #C4A484; border-radius: 0 8px 8px 0; padding: 20px; margin-bottom: 30px;">
            <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9A3B3B; margin: 0 0 12px 0;">Shipping Address</h3>
            <p style="font-size: 15px; line-height: 1.8; color: #2C2A24; margin: 0;">
              ${customerName}<br>
              ${formattedAddress}
            </p>
          </div>

          <!-- What's Next -->
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #C4A484; margin: 0 0 15px 0;">What's Next?</h3>
            <ul style="padding-left: 20px; margin: 0;">
              <li style="font-size: 15px; line-height: 1.8; color: #2C2A24; margin-bottom: 8px;">We'll notify you when your order ships</li>
              <li style="font-size: 15px; line-height: 1.8; color: #2C2A24; margin-bottom: 8px;">Tracking information will be included in the shipping email</li>
              <li style="font-size: 15px; line-height: 1.8; color: #2C2A24;">Estimated delivery: 5-7 business days</li>
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

export async function handleStripeWebhook(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const metadata = session.metadata;
      if (!metadata || !metadata.items) {
        throw new Error('Missing metadata in session');
      }
      
      const items: { id: string; quantity: number; price: number; name?: string; comboId?: string | null; originalProductId?: string | null; color?: string | null }[] = JSON.parse(metadata.items);
      const totalAmount = (session.amount_total || 0) / 100;
      const customerEmail = session.customer_details?.email || session.customer_email || '';
      const customerName = metadata.customerName || session.customer_details?.name || '';
      const couponCode = metadata.couponCode || null;
      const discountAmount = metadata.discountAmount ? parseFloat(metadata.discountAmount) : 0;
      const isPickup = metadata.isPickup === 'true';

      // Create order in database
      const order = await prisma.order.create({
        data: {
          id: metadata.orderId,
          customerName,
          customerEmail,
          addressLine1: metadata.addressLine1 || '',
          addressLine2: metadata.addressLine2 || null,
          city: metadata.city || '',
          postalCode: metadata.postalCode || '',
          country: metadata.country || '',
          totalAmount,
          paymentId: session.payment_intent as string,
          status: 'COMPLETED',
          couponCode,
          discountAmount,
          isPickup,
          items: {
            create: items.map((item) => ({
              // Use originalProductId for combo items, otherwise use the regular id
              productId: item.originalProductId || item.id,
              quantity: item.quantity,
              price: item.price,
              comboId: item.comboId || null,
              color: item.color || null,
            })),
          },
        },
      });

      // Decrement stock for each purchased item
      // For combo items, use the originalProductId
      for (const item of items) {
        const productIdToUpdate = item.originalProductId || item.id;
        await prisma.product.update({
          where: { id: productIdToUpdate },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Fetch product names for email if not in metadata
      let emailItems: OrderConfirmationItem[] = [];
      if (items[0]?.name) {
        // Names are already in metadata
        emailItems = items.map(item => ({
          name: item.name || 'Item',
          quantity: item.quantity,
          price: item.price,
        }));
      } else {
        // Fetch product names from database
        const products = await prisma.product.findMany({
          where: { id: { in: items.map(i => i.id) } },
          select: { id: true, name: true },
        });
        const productMap = new Map<string, string>(products.map((p: { id: string; name: string }) => [p.id, p.name]));
        emailItems = items.map(item => ({
          name: productMap.get(item.id) ?? 'Item',
          quantity: item.quantity,
          price: item.price,
        }));
      }

      // Send order confirmation email
      try {
        await sendOrderConfirmationEmail({
          orderId: order.id,
          customerName,
          customerEmail,
          items: emailItems,
          totalAmount,
          shippingAddress: {
            line1: metadata.addressLine1 || '',
            line2: metadata.addressLine2 || null,
            city: metadata.city || '',
            postalCode: metadata.postalCode || '',
            country: metadata.country || '',
          },
        });
        console.log('Order confirmation email sent successfully to:', customerEmail);
      } catch (emailError) {
        // Log detailed email error but don't fail the webhook
        // Note: Resend test mode (onboarding@resend.dev) only sends to the account owner's email
        console.error('Failed to send order confirmation email:', emailError);
      }

      // Revalidate admin pages to show new order and updated stock
      revalidatePath('/admin/orders');
      revalidatePath('/admin');
      revalidatePath('/');
    }

    return { received: true };
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}

// Combo Settings Actions
export async function updateComboSettings(comboDiscount2: number, comboDiscount3: number) {
  try {
    if (!prisma.settings) {
      console.warn('prisma.settings is undefined.');
      return { success: false, error: 'Prisma client is outdated.' };
    }

    await prisma.settings.upsert({
      where: { id: 'global' },
      update: { comboDiscount2, comboDiscount3 },
      create: { id: 'global', comboDiscount2, comboDiscount3 },
    });
    
    revalidatePath('/admin');
    revalidatePath('/combos');
    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Failed to update combo settings.' };
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
  try {
    await prisma.settings.upsert({
      where: { id: 'global' },
      update: data,
      create: { 
        id: 'global', 
        comboDiscount2: data.comboDiscount2 ?? 10,
        comboDiscount3: data.comboDiscount3 ?? 15,
        estimatedDeliveryMin: data.estimatedDeliveryMin ?? 2,
        estimatedDeliveryMax: data.estimatedDeliveryMax ?? 4,
        allowStorePickup: data.allowStorePickup ?? false,
        pickupAddress: data.pickupAddress ?? null,
      },
    });
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Failed to update store settings.' };
  }
}

export async function createShippingRule(minAmount: number, price: number, maxAmount?: number | null) {
  try {
    await prisma.shippingRule.create({
      data: { minAmount, price, maxAmount: maxAmount ?? null },
    });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Failed to create shipping rule.' };
  }
}

export async function deleteShippingRule(id: string) {
  try {
    await prisma.shippingRule.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Failed to delete shipping rule.' };
  }
}

export async function createHeroImage(formData: FormData) {
  const imageFiles = formData.getAll('image') as File[];
  const altText = formData.get('altText') as string;
  const sortOrderBase = parseInt(formData.get('sortOrder') as string || '0');

  if (imageFiles.length === 0 || (imageFiles.length === 1 && imageFiles[0].size === 0)) {
    return { success: false, error: 'At least one image is required' };
  }

  try {
    const createdImages = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      if (imageFile.size === 0) continue;

      const fileName = `hero/${randomUUID()}-${imageFile.name}`;
      const blob = await put(fileName, imageFile, { access: 'public' });
      
      const image = await prisma.heroImage.create({
        data: {
          imageUrl: blob.url,
          altText,
          sortOrder: sortOrderBase + i,
        },
      });
      createdImages.push(image);
    }
    
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true, images: createdImages };
  } catch (error) {
    console.error('Error creating hero image:', error);
    return { success: false, error: 'Failed to upload hero images.' };
  }
}

export async function deleteHeroImage(id: string) {
  try {
    await prisma.heroImage.delete({ where: { id } });
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Failed to delete hero image.' };
  }
}

export async function reorderHeroImages(orderedIds: { id: string; sortOrder: number }[]) {
  try {
    await prisma.$transaction(
      orderedIds.map(({ id, sortOrder }) =>
        prisma.heroImage.update({
          where: { id },
          data: { sortOrder },
        })
      )
    );
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Failed to reorder hero images.' };
  }
}

export async function uploadVariantImage(formData: FormData) {
  const file = formData.get('image') as File;
  if (!file || file.size === 0) return { success: false, error: 'No file' };
  
  try {
    const fileName = `variants/${randomUUID()}-${file.name}`;
    const blob = await put(fileName, file, { access: 'public' });
    return { success: true, url: blob.url };
  } catch (e) {
    return { success: false, error: 'Upload failed' };
  }
}

// Coupon Actions
export async function createCoupon(formData: FormData) {
  const code = (formData.get('code') as string).toUpperCase();
  const discountType = formData.get('discountType') as 'PERCENTAGE' | 'FIXED';
  const discountValue = parseFloat(formData.get('discountValue') as string);
  const minOrderAmount = formData.get('minOrderAmount') ? parseFloat(formData.get('minOrderAmount') as string) : null;

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue,
        minOrderAmount,
      },
    });
    revalidatePath('/admin/settings');
    return { 
      success: true, 
      coupon: {
        ...coupon,
        discountType: coupon.discountType as 'PERCENTAGE' | 'FIXED',
        discountValue: Number(coupon.discountValue),
        minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
      }
    };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Failed to create coupon. Code might already exist.' };
  }
}

export async function deleteCoupon(id: string) {
  try {
    await prisma.coupon.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Failed to delete coupon.' };
  }
}

export async function validateCoupon(code: string, orderAmount: number) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase(), isActive: true },
    });

    if (!coupon) {
      return { success: false, error: 'Invalid or expired coupon code.' };
    }

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      return { success: false, error: `Minimum order amount of $${coupon.minOrderAmount} required.` };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { success: false, error: 'This coupon has expired.' };
    }

    return {
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType as 'PERCENTAGE' | 'FIXED',
        discountValue: Number(coupon.discountValue),
      }
    };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Failed to validate coupon.' };
  }
}
