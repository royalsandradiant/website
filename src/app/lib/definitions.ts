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
  isCombo: boolean;
  comboPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductWithCategory = Product & {
  categoryRef: Category | null;
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
  };
  message?: string | null;
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






