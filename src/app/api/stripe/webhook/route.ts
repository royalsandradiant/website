import { NextRequest, NextResponse } from 'next/server';
import { handleStripeWebhook } from '@/app/lib/actions';

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  try {
    await handleStripeWebhook(payload, signature);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
