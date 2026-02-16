import type { Product, ProductWithCategory, ShippingCategory } from "@/app/lib/definitions";

const CLOTHES_KEYWORDS = [
  "cloth",
  "clothes",
  "clothing",
  "apparel",
  "garment",
  "dress",
  "lehenga",
  "kurta",
  "kurti",
  "blouse",
  "saree",
  "shirt",
  "top",
  "pant",
  "skirt",
];

const JEWELRY_KEYWORDS = [
  "jewel",
  "jewelry",
  "jewellery",
  "necklace",
  "earring",
  "ring",
  "bracelet",
  "bangle",
  "pendant",
  "anklet",
  "brooch",
  "chain",
  "accessory",
];

const SHIPPING_CATEGORIES: ShippingCategory[] = ["clothes", "jewelry"];

function containsKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function normalizeShippingCategory(
  value: string | null | undefined,
): ShippingCategory | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return SHIPPING_CATEGORIES.includes(normalized as ShippingCategory)
    ? (normalized as ShippingCategory)
    : null;
}

export function inferShippingCategoryFromText(
  value: string | null | undefined,
): ShippingCategory | null {
  if (!value) return null;
  const normalized = value.toLowerCase();

  if (containsKeyword(normalized, CLOTHES_KEYWORDS)) {
    return "clothes";
  }
  if (containsKeyword(normalized, JEWELRY_KEYWORDS)) {
    return "jewelry";
  }
  return null;
}

type ProductForShipping = Pick<Product, "category" | "subcategory"> & {
  categoryRef?: Pick<NonNullable<ProductWithCategory["categoryRef"]>, "name" | "slugPath"> | null;
};

export function inferShippingCategoryFromProduct(
  product: ProductForShipping,
): ShippingCategory {
  const candidates = [
    product.categoryRef?.slugPath,
    product.categoryRef?.name,
    product.category,
    product.subcategory,
  ];

  for (const candidate of candidates) {
    const inferred = inferShippingCategoryFromText(candidate);
    if (inferred) return inferred;
  }

  // Default to jewelry to preserve existing storefront behavior.
  return "jewelry";
}

export function getEffectiveShippingCategory(
  items: Array<{ shippingCategory?: ShippingCategory | null }>,
): ShippingCategory {
  const hasClothes = items.some((item) => item.shippingCategory === "clothes");
  return hasClothes ? "clothes" : "jewelry";
}
