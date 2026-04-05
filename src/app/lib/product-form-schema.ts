import { z } from "zod";

/** Client-side guardrails; server actions still own authoritative validation. */
export const productFormClientSchema = z
  .object({
    name: z.string().trim().min(1, "Product name is required."),
    description: z.string().trim().min(1, "Description is required."),
    price: z.string().trim().min(1, "Price is required."),
    categoryId: z.string().trim().min(1, "Category is required."),
    stock: z.string().trim().min(1, "Stock is required."),
    salePrice: z.string(),
    salePercentage: z.string(),
    isFeatured: z.boolean(),
    isOnSale: z.boolean(),
    isCombo: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isOnSale) {
      return;
    }
    const salePriceTrim = data.salePrice.trim();
    const salePercentageTrim = data.salePercentage.trim();
    if (!salePriceTrim && !salePercentageTrim) {
      ctx.addIssue({
        code: "custom",
        path: ["salePrice"],
        message:
          "Enter a sale price or a sale percentage when the product is on sale.",
      });
      ctx.addIssue({
        code: "custom",
        path: ["salePercentage"],
        message:
          "Enter a sale price or a sale percentage when the product is on sale.",
      });
      return;
    }
    if (salePriceTrim) {
      const n = Number(salePriceTrim);
      if (!Number.isFinite(n) || n <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["salePrice"],
          message: "Sale price must be a positive number.",
        });
      }
    }
    if (salePercentageTrim) {
      const n = Number(salePercentageTrim);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["salePercentage"],
          message: "Sale percentage must be between 0 and 100.",
        });
      }
    }
  });

export type ProductFormValues = z.infer<typeof productFormClientSchema>;
