import { z } from "zod";

/** Checkout address fields + pickup flag; shipping fields required when not pickup. */
export const checkoutFormSchema = z
  .object({
    isPickup: z.boolean(),
    customerName: z.string().trim().min(1, "Please fill in your full name."),
    customerEmail: z
      .string()
      .trim()
      .min(1, "Please fill in your email.")
      .pipe(z.email("Please enter a valid email address.")),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isPickup) {
      return;
    }
    if (!data.addressLine1?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["addressLine1"],
        message: "Please fill in your address line 1.",
      });
    }
    if (!data.city?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["city"],
        message: "Please fill in your city.",
      });
    }
    if (!data.postalCode?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["postalCode"],
        message: "Please fill in your postal code.",
      });
    }
    if (!data.country?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Please select your country.",
      });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
