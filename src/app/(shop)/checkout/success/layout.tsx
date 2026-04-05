import type { Metadata } from "next";

/** Reduces accidental leakage of `session_id` to third parties via Referer on outbound navigation. */
export const metadata: Metadata = {
  referrer: "no-referrer",
};

export default function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
