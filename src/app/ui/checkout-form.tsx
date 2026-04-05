"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import {
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { createStripeCheckoutSession, validateCoupon } from "@/app/lib/actions";
import { useCart } from "@/app/lib/cart-context";
import {
  type CheckoutFormValues,
  checkoutFormSchema,
} from "@/app/lib/checkout-form-schema";
import type { ShippingRule } from "@/app/lib/definitions";
import {
  CA_PROVINCE_OPTIONS,
  US_STATE_OPTIONS,
} from "@/app/lib/region-options";
import { inferShippingCategoryFromText } from "@/app/lib/shipping";

/** TanStack Form + Zod store issues as `{ message }` objects, not strings. */
function formatFieldValidatorError(error: unknown): string {
  if (error == null) {
    return "";
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string") {
      return msg;
    }
  }
  return "Invalid value";
}

export default function CheckoutForm({
  shippingRules,
  allowPickup = false,
  pickupAddress = "",
}: {
  shippingRules: ShippingRule[];
  allowPickup?: boolean;
  pickupAddress?: string | null;
}) {
  const { items, total } = useCart();
  const [submitError, setSubmitError] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  const couponMutation = useMutation({
    mutationFn: (code: string) => validateCoupon(code, total),
    onMutate: () => setCouponError(""),
    onSuccess: (result) => {
      if (result.success && result.coupon) {
        setAppliedCoupon(result.coupon);
        setCouponInput("");
      } else {
        setCouponError(result.error || "Invalid coupon code.");
      }
    },
    onError: () => setCouponError("Failed to validate coupon."),
  });

  const form = useForm({
    defaultValues: {
      isPickup: false,
      customerName: "",
      customerEmail: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    } as CheckoutFormValues,
    validators: {
      onSubmit: checkoutFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError("");
      try {
        const country = value.country ?? "";
        const rawState = value.state ?? "";
        const stateForApi =
          country === "US" || country === "CA"
            ? rawState.trim().toUpperCase()
            : rawState.trim();
        const result = await createStripeCheckoutSession(
          items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            images: item.imagePath ? [item.imagePath] : [],
            comboId: item.comboId,
            originalProductId: item.originalProductId,
            color: item.color,
            size: item.size,
          })),
          value.isPickup
            ? {
                customerName: value.customerName,
                customerEmail: value.customerEmail,
                addressLine1: "STORE PICKUP",
                city: "PICKUP",
                state: "",
                postalCode: "PICKUP",
                country: "US",
              }
            : {
                customerName: value.customerName,
                customerEmail: value.customerEmail,
                addressLine1: value.addressLine1 ?? "",
                addressLine2: value.addressLine2 ?? "",
                city: value.city ?? "",
                state: stateForApi,
                postalCode: value.postalCode ?? "",
                country: country,
              },
          shippingCost,
          appliedCoupon
            ? {
                code: appliedCoupon.code,
                discountAmount: discountAmount,
              }
            : undefined,
          value.isPickup,
        );

        if (result.url) {
          window.location.href = result.url;
        } else {
          setSubmitError(result.error || "Failed to create checkout session");
        }
      } catch (err) {
        console.error("Checkout error:", err);
        setSubmitError("An unexpected error occurred. Please try again.");
      }
    },
  });

  const isPickup = useStore(form.store, (s) => s.values.isPickup);
  const shippingCountry = useStore(form.store, (s) => s.values.country);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "PERCENTAGE") {
      return (total * appliedCoupon.discountValue) / 100;
    }
    return appliedCoupon.discountValue;
  }, [total, appliedCoupon]);

  const subtotalAfterDiscount = Math.max(0, total - discountAmount);

  const cartShippingContext = useMemo(() => {
    const categories = items.map(
      (item) =>
        item.shippingCategory ??
        inferShippingCategoryFromText(item.name) ??
        "jewelry",
    );
    const hasClothes = categories.includes("clothes");
    const hasJewelry = categories.includes("jewelry");
    return {
      hasClothes,
      hasJewelry,
      effectiveCategory: hasClothes ? "clothes" : "jewelry",
    };
  }, [items]);

  const activeShippingRules = useMemo(() => {
    const matchedRules = shippingRules.filter(
      (rule) => rule.category === cartShippingContext.effectiveCategory,
    );
    if (matchedRules.length > 0) {
      return matchedRules;
    }

    const jewelryRules = shippingRules.filter(
      (rule) => rule.category === "jewelry",
    );
    return jewelryRules.length > 0 ? jewelryRules : shippingRules;
  }, [shippingRules, cartShippingContext.effectiveCategory]);

  const shippingCost = useMemo(() => {
    if (isPickup) return 0;
    if (activeShippingRules.length === 0) return 0;
    const rule = activeShippingRules.find(
      (r) =>
        subtotalAfterDiscount >= Number(r.minAmount) &&
        (r.maxAmount === null || subtotalAfterDiscount <= Number(r.maxAmount)),
    );
    return rule ? Number(rule.price) : 0;
  }, [subtotalAfterDiscount, activeShippingRules, isPickup]);

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-foreground/60">Your cart is empty.</p>
      </div>
    );
  }

  const finalTotal = subtotalAfterDiscount + shippingCost;

  const handleApplyCoupon = () => {
    if (!couponInput.trim() || couponMutation.isPending) return;
    couponMutation.mutate(couponInput.trim());
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-foreground">
            Delivery Method
          </h2>
        </div>

        {allowPickup && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => form.setFieldValue("isPickup", false)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                !isPickup
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-transparent text-foreground/60 hover:border-foreground/20"
              }`}
            >
              <Truck className="h-6 w-6" />
              <span className="text-sm font-semibold">Shipping</span>
            </button>
            <button
              type="button"
              onClick={() => form.setFieldValue("isPickup", true)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                isPickup
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-transparent text-foreground/60 hover:border-foreground/20"
              }`}
            >
              <MapPin className="h-6 w-6" />
              <span className="text-sm font-semibold">Store Pickup</span>
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4">
            <form.Field name="customerName">
              {(field) => (
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-sm font-medium text-foreground/70 mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                    placeholder="John Doe"
                    autoComplete="name"
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors[0] != null ? (
                    <p className="mt-1 text-xs text-red-500">
                      {formatFieldValidatorError(field.state.meta.errors[0])}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
            <form.Field name="customerEmail">
              {(field) => (
                <div>
                  <label
                    htmlFor="customerEmail"
                    className="block text-sm font-medium text-foreground/70 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    id="customerEmail"
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                    placeholder="john@example.com"
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors[0] != null ? (
                    <p className="mt-1 text-xs text-red-500">
                      {formatFieldValidatorError(field.state.meta.errors[0])}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
          </div>

          {!isPickup ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="font-display text-xl text-foreground mt-6 mb-4">
                Shipping Address
              </h3>
              <form.Field name="addressLine1">
                {(field) => (
                  <div>
                    <label
                      htmlFor="addressLine1"
                      className="block text-sm font-medium text-foreground/70 mb-2"
                    >
                      Address Line 1 *
                    </label>
                    <input
                      id="addressLine1"
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                      placeholder="123 Main Street"
                      autoComplete="address-line1"
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.errors[0] != null ? (
                      <p className="mt-1 text-xs text-red-500">
                        {formatFieldValidatorError(field.state.meta.errors[0])}
                      </p>
                    ) : null}
                  </div>
                )}
              </form.Field>
              <form.Field name="addressLine2">
                {(field) => (
                  <div>
                    <label
                      htmlFor="addressLine2"
                      className="block text-sm font-medium text-foreground/70 mb-2"
                    >
                      Address Line 2 (Optional)
                    </label>
                    <input
                      id="addressLine2"
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                      placeholder="Apt 4B"
                      autoComplete="address-line2"
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="country">
                {(field) => (
                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-foreground/70 mb-2"
                    >
                      Country *
                    </label>
                    <select
                      id="country"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        form.setFieldValue("state", "");
                      }}
                      onBlur={field.handleBlur}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                      autoComplete="country"
                      aria-invalid={field.state.meta.errors.length > 0}
                    >
                      <option value="">Select a country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="IN">India</option>
                    </select>
                    {field.state.meta.errors[0] != null ? (
                      <p className="mt-1 text-xs text-red-500">
                        {formatFieldValidatorError(field.state.meta.errors[0])}
                      </p>
                    ) : null}
                  </div>
                )}
              </form.Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <form.Field name="city">
                  {(field) => (
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-foreground/70 mb-2"
                      >
                        City *
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                        placeholder="New York"
                        autoComplete="address-level2"
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                      {field.state.meta.errors[0] != null ? (
                        <p className="mt-1 text-xs text-red-500">
                          {formatFieldValidatorError(field.state.meta.errors[0])}
                        </p>
                      ) : null}
                    </div>
                  )}
                </form.Field>
                <form.Field name="state">
                  {(field) => (
                    <div>
                      <label
                        htmlFor="state"
                        className="block text-sm font-medium text-foreground/70 mb-2"
                      >
                        {shippingCountry === "CA"
                          ? "Province *"
                          : "State / Province *"}
                      </label>
                      {!shippingCountry ? (
                        <select
                          id="state"
                          disabled
                          className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg text-foreground/50 cursor-not-allowed outline-none"
                          value=""
                        >
                          <option value="">Select country first</option>
                        </select>
                      ) : shippingCountry === "US" ? (
                        <select
                          id="state"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                          autoComplete="address-level1"
                          aria-invalid={field.state.meta.errors.length > 0}
                        >
                          <option value="">Select state</option>
                          {US_STATE_OPTIONS.map((s) => (
                            <option key={s.code} value={s.code}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : shippingCountry === "CA" ? (
                        <select
                          id="state"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                          autoComplete="address-level1"
                          aria-invalid={field.state.meta.errors.length > 0}
                        >
                          <option value="">Select province</option>
                          {CA_PROVINCE_OPTIONS.map((s) => (
                            <option key={s.code} value={s.code}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id="state"
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                          placeholder="County or region"
                          autoComplete="address-level1"
                          aria-invalid={field.state.meta.errors.length > 0}
                        />
                      )}
                      {field.state.meta.errors[0] != null ? (
                        <p className="mt-1 text-xs text-red-500">
                          {formatFieldValidatorError(field.state.meta.errors[0])}
                        </p>
                      ) : null}
                    </div>
                  )}
                </form.Field>
                <form.Field name="postalCode">
                  {(field) => (
                    <div>
                      <label
                        htmlFor="postalCode"
                        className="block text-sm font-medium text-foreground/70 mb-2"
                      >
                        Postal Code *
                      </label>
                      <input
                        id="postalCode"
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all outline-none"
                        placeholder="10001"
                        autoComplete="postal-code"
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                      {field.state.meta.errors[0] != null ? (
                        <p className="mt-1 text-xs text-red-500">
                          {formatFieldValidatorError(field.state.meta.errors[0])}
                        </p>
                      ) : null}
                    </div>
                  )}
                </form.Field>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-6 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-primary mb-1">
                    Pickup Location
                  </h3>
                  <p className="text-sm text-foreground/70 whitespace-pre-line">
                    {pickupAddress || "Address not configured."}
                  </p>
                  <p className="text-xs text-primary/60 mt-4 italic">
                    * Please bring your order confirmation and a valid ID when
                    picking up.
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        {submitError ? (
          <div
            className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4"
            role="alert"
          >
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="mb-6 font-display text-2xl text-foreground">
          Order Summary
        </h2>
        <div className="rounded-lg bg-secondary/30 border border-border p-6">
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm tabular-nums"
              >
                <div className="flex flex-col">
                  <span className="text-foreground/70">
                    {item.name} × {item.quantity}
                  </span>
                  {item.size ? (
                    <span className="text-[10px] text-foreground/40 font-bold uppercase">
                      Size: {item.size}
                    </span>
                  ) : null}
                </div>
                <span className="font-medium text-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border my-4" />

          <div className="flex justify-between text-sm mb-2 tabular-nums">
            <span className="text-foreground/70">Subtotal</span>
            <span className="text-foreground">${total.toFixed(2)}</span>
          </div>

          <div className="mt-4 mb-4">
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    placeholder="Coupon Code"
                    className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponMutation.isPending || !couponInput.trim()}
                  className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                >
                  {couponMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-xs text-primary/70">
                    (
                    {appliedCoupon.discountType === "PERCENTAGE"
                      ? `${appliedCoupon.discountValue}%`
                      : `$${appliedCoupon.discountValue}`}{" "}
                    off)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-primary hover:text-primary/70 transition-colors"
                  aria-label="Remove applied coupon"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {couponError ? (
              <p className="mt-1 text-xs text-red-500">{couponError}</p>
            ) : null}
          </div>

          {appliedCoupon ? (
            <div className="flex justify-between text-sm mb-2 tabular-nums">
              <span className="text-foreground/70">Discount</span>
              <span className="text-primary">
                -${discountAmount.toFixed(2)}
              </span>
            </div>
          ) : null}

          <div className="flex justify-between text-sm mb-4 tabular-nums">
            <span className="text-foreground/70">
              {isPickup ? "Store Pickup" : `Shipping`}
            </span>
            <span
              className={
                shippingCost === 0
                  ? "text-green-600 font-bold"
                  : "text-foreground"
              }
            >
              {shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
            </span>
          </div>
          {!isPickup &&
            cartShippingContext.hasClothes &&
            cartShippingContext.hasJewelry && (
              <p className="mb-4 text-xs text-foreground/50">
                Mixed cart detected: clothes shipping rules are prioritized.
              </p>
            )}

          <div className="flex justify-between text-lg font-semibold mb-6 tabular-nums">
            <span className="text-foreground">Total</span>
            <span className="text-primary">${finalTotal.toFixed(2)}</span>
          </div>

          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest text-center">
              All sales are final • No returns or exchanges
            </p>
          </div>

          <button
            type="button"
            onClick={() => void form.handleSubmit()}
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-primary-foreground font-semibold tracking-wide rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
            <span>Proceed to Payment</span>
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground/50">
            <ShieldCheck className="h-4 w-4" />
            <span>Secured by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
