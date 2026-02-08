// Category types
export type Category = {
  id: string;
  name: string;
  slug: string;
  slugPath: string;
  description: string | null;
  imageUrl: string | null;
  isVisible: boolean;
  sortOrder: number;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryWithChildren = Category & {
  children: CategoryWithChildren[];
};

export type CategoryNode = Category & {
  parent: Category | null;
  children: Category[];
  _count?: { products: number };
};

export type LeafCategory = {
  id: string;
  name: string;
  slugPath: string;
  fullPath: string; // Human-readable path like "Dresses > Lehengas"
};

// Product types
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string | null;
  category: string | null; // Legacy field
  subcategory: string | null; // Legacy field
  stock: number;
  isOnSale: boolean;
  isFeatured: boolean;
  salePrice: number | null;
  salePercentage: number | null;
  isCombo: boolean;
  comboPrice: number | null;
  sizeChartUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  variants?: ProductVariant[];
};

export type ProductVariant = {
  id: string;
  productId: string;
  colorName: string;
  hexCode: string | null;
  imageUrl: string | null;
  images: string[];
  price: number | null;
  stock: number;
};

export type ProductWithCategory = Product & {
  categoryRef: Category | null;
};

// Coupon types
export type Coupon = {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number | null;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Form state types
export type State = {
  errors?: {
    name?: string[];
    description?: string[];
    price?: string[];
    category?: string[];
    categoryId?: string[];
    stock?: string[];
    sizeChartUrl?: string[];
  };
  message?: string | null;
};

export type HeroImage = {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ShippingRule = {
  id: string;
  minAmount: number;
  maxAmount: number | null;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export type StoreSettings = {
  comboDiscount2: number;
  comboDiscount3: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  allowStorePickup: boolean;
  pickupAddress: string | null;
};

export type CategoryState = {
  errors?: {
    name?: string[];
    slug?: string[];
    description?: string[];
    parentId?: string[];
    sortOrder?: string[];
  };
  message?: string | null;
};






