'use server';

import { prisma } from './prisma';
import { Product, Category, ProductWithCategory, LeafCategory, ShippingRule } from './definitions';
import { buildCategoryTree, flattenCategoryTree, getLeafCategories } from './category';

function transformProduct(product: any | null): Product | null {
  if (!product) return null;
  
  // Handle transition from imagePath to images array
  const images = product.images && product.images.length > 0 
    ? product.images 
    : (product.imagePath ? [product.imagePath] : []);

  return {
    ...product,
    images,
    price: Number(product.price),
    isOnSale: product.isOnSale || false,
    isFeatured: product.isFeatured || false,
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    salePercentage: product.salePercentage || null,
    isCombo: product.isCombo || false,
    comboPrice: product.comboPrice ? Number(product.comboPrice) : null,
    variants: product.variants ? product.variants.map((v: any) => ({
      ...v,
      price: v.price ? Number(v.price) : null
    })) : []
  };
}

function transformProductWithCategory(product: any | null): ProductWithCategory | null {
  if (!product) return null;
  
  const base = transformProduct(product);
  if (!base) return null;

  return {
    ...base,
    categoryRef: product.categoryRef || null,
  };
}

// ===================
// Category Functions
// ===================

export async function fetchCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories as Category[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch categories.');
  }
}

export async function fetchVisibleCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { isVisible: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories as Category[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch visible categories.');
  }
}

export async function fetchCategoryTree() {
  try {
    const categories = await fetchVisibleCategories();
    return buildCategoryTree(categories);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch category tree.');
  }
}

export async function fetchAllCategoryTree() {
  try {
    const categories = await fetchCategories();
    return buildCategoryTree(categories);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch all category tree.');
  }
}

export async function fetchCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        _count: { select: { products: true } },
      },
    });
    return category;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch category.');
  }
}

export async function fetchCategoryBySlugPath(slugPath: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slugPath },
      include: {
        parent: true,
        children: {
          where: { isVisible: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
    return category;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch category by slug path.');
  }
}

export async function fetchLeafCategories(): Promise<LeafCategory[]> {
  try {
    const categories = await fetchCategories();
    const tree = buildCategoryTree(categories);
    return getLeafCategories(tree);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch leaf categories.');
  }
}

export async function fetchAllCategoriesFlat(): Promise<LeafCategory[]> {
  try {
    const categories = await fetchCategories();
    const tree = buildCategoryTree(categories);
    return flattenCategoryTree(tree);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch flattened categories.');
  }
}

export async function fetchProductsByCategoryPath(slugPath: string) {
  try {
    // Get the category and all its descendants
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { slugPath },
          { slugPath: { startsWith: `${slugPath}/` } },
        ],
      },
      select: { id: true },
    });
    
    const categoryIds = categories.map(c => c.id);
    
    if (categoryIds.length === 0) {
      return [];
    }

    const products = await prisma.product.findMany({
      where: { categoryId: { in: categoryIds } },
      include: { categoryRef: true },
      orderBy: { createdAt: 'desc' },
    });

    return products.map(transformProductWithCategory);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch products by category path.');
  }
}

// ===================
// Product Functions
// ===================

export async function fetchProducts() {
  try {
    const products = await prisma.product.findMany({
      include: { categoryRef: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(transformProductWithCategory);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch products.');
  }
}

export async function fetchFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      include: { categoryRef: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(transformProductWithCategory);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch featured products.');
  }
}

export async function fetchProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        categoryRef: true,
        variants: {
          orderBy: { colorName: 'asc' }
        }
      },
    });
    return transformProductWithCategory(product);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch product.');
  }
}

/**
 * @deprecated Use fetchProductsByCategoryPath instead
 */
export async function fetchProductsByCategory(category: string) {
  try {
    // Try new category system first - find by slugPath
    const categoryRecord = await prisma.category.findUnique({
      where: { slugPath: category.toLowerCase() },
    });
    
    if (categoryRecord) {
      return fetchProductsByCategoryPath(category.toLowerCase());
    }
    
    // Fall back to legacy string-based filtering
    const products = await prisma.product.findMany({
      include: { categoryRef: true },
      orderBy: { createdAt: 'desc' },
    });
    const filtered = products.filter(p => 
      p.category?.toLowerCase() === category.toLowerCase()
    );
    return filtered.map(transformProductWithCategory);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch products by category.');
  }
}

/**
 * @deprecated Use fetchProductsByCategoryPath instead
 */
export async function fetchProductsBySubcategory(category: string, subcategory: string) {
  try {
    // Try new category system first
    const slugPath = `${category.toLowerCase()}/${subcategory.toLowerCase().replace(/\s+/g, '-')}`;
    const categoryRecord = await prisma.category.findUnique({
      where: { slugPath },
    });
    
    if (categoryRecord) {
      return fetchProductsByCategoryPath(slugPath);
    }
    
    // Fall back to legacy string-based filtering
    const products = await prisma.product.findMany({
      include: { categoryRef: true },
      orderBy: { createdAt: 'desc' },
    });
    const filtered = products.filter(p => 
      p.category?.toLowerCase() === category.toLowerCase() &&
      p.subcategory?.toLowerCase() === subcategory.toLowerCase()
    );
    return filtered.map(transformProductWithCategory);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch products by subcategory.');
  }
}

export async function fetchSaleProducts(categorySlugPath?: string) {
  try {
    let whereClause: any = { isOnSale: true };
    
    if (categorySlugPath) {
      // Get all category IDs for this path and descendants
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { slugPath: categorySlugPath },
            { slugPath: { startsWith: `${categorySlugPath}/` } },
          ],
        },
        select: { id: true },
      });
      
      const categoryIds = categories.map(c => c.id);
      
      if (categoryIds.length > 0) {
        whereClause = {
          isOnSale: true,
          categoryId: { in: categoryIds },
        };
      }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { categoryRef: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(transformProductWithCategory);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch sale products.');
  }
}

export async function fetchOrders() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } }
    });
    
    return orders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        product: transformProduct(item.product)
      }))
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch orders.');
  }
}

export async function fetchComboProducts() {
  try {
    if (!prisma.product) {
      console.warn('prisma.product is undefined.');
      return [];
    }

    const products = await prisma.product.findMany({
      where: { isCombo: true },
      include: { categoryRef: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(transformProductWithCategory);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch combo products.');
  }
}

export async function fetchComboSettings() {
  try {
    // Safety check for prisma.settings existence
    if (!prisma.settings) {
      console.warn('prisma.settings is undefined. This may be due to an outdated Prisma client.');
      return { 
        comboDiscount2: 10, 
        comboDiscount3: 15, 
        estimatedDeliveryMin: 2, 
        estimatedDeliveryMax: 4,
        allowStorePickup: false,
        pickupAddress: null
      };
    }

    let settings = await prisma.settings.findUnique({
      where: { id: 'global' },
    });
    
    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.settings.create({
        data: {
          id: 'global',
          comboDiscount2: 10,
          comboDiscount3: 15,
          estimatedDeliveryMin: 2,
          estimatedDeliveryMax: 4,
          allowStorePickup: false,
          pickupAddress: null,
        },
      });
    }
    
    return {
      comboDiscount2: settings.comboDiscount2,
      comboDiscount3: settings.comboDiscount3,
      estimatedDeliveryMin: settings.estimatedDeliveryMin,
      estimatedDeliveryMax: settings.estimatedDeliveryMax,
      allowStorePickup: settings.allowStorePickup,
      pickupAddress: settings.pickupAddress,
    };
  } catch (error) {
    console.error('Database Error:', error);
    // Fallback to default if there's an error
    return { 
      comboDiscount2: 10, 
      comboDiscount3: 15, 
      estimatedDeliveryMin: 2, 
      estimatedDeliveryMax: 4,
      allowStorePickup: false,
      pickupAddress: null
    };
  }
}

export async function fetchCoupons() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return coupons.map(c => ({
      ...c,
      discountType: c.discountType as 'PERCENTAGE' | 'FIXED',
      discountValue: Number(c.discountValue),
      minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    }));
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}

export async function fetchCouponByCode(code: string) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) return null;
    return {
      ...coupon,
      discountType: coupon.discountType as 'PERCENTAGE' | 'FIXED',
      discountValue: Number(coupon.discountValue),
      minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    };
  } catch (error) {
    console.error('Database Error:', error);
    return null;
  }
}

export async function fetchHeroImages() {
  try {
    return await prisma.heroImage.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}

export async function fetchAllHeroImages() {
  try {
    return await prisma.heroImage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}

export async function fetchShippingRules() {
  try {
    const rules = await prisma.shippingRule.findMany({
      orderBy: { minAmount: 'asc' },
    });
    return rules.map(r => ({
      ...r,
      minAmount: Number(r.minAmount),
      maxAmount: r.maxAmount ? Number(r.maxAmount) : null,
      price: Number(r.price),
    })) as ShippingRule[];
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}
