import { z } from "zod";
import { CA_PROVINCE_CODES, US_STATE_CODES } from "./region-options";

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
    state: z.string().optional(),
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
    const country = data.country?.trim();
    if (!country) {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Please select your country.",
      });
    }
    const stateRaw = data.state?.trim() ?? "";
    if (!stateRaw) {
      ctx.addIssue({
        code: "custom",
        path: ["state"],
        message: "Please select or enter your state or province.",
      });
    } else if (country === "US") {
      const code = stateRaw.toUpperCase();
      if (!US_STATE_CODES.has(code)) {
        ctx.addIssue({
          code: "custom",
          path: ["state"],
          message: "Choose a valid US state.",
        });
      }
    } else if (country === "CA") {
      const code = stateRaw.toUpperCase();
      if (!CA_PROVINCE_CODES.has(code)) {
        ctx.addIssue({
          code: "custom",
          path: ["state"],
          message: "Choose a valid Canadian province or territory.",
        });
      }
    }
    if (!data.postalCode?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["postalCode"],
        message: "Please fill in your postal code.",
      });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
