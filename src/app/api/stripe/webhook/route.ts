import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { handleStripeWebhook } from "@/app/lib/actions";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  try {
    await handleStripeWebhook(payload, signature);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    // 5xx so Stripe retries transient failures; 4xx would suppress retries.
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
