import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { getCurrentUser } from '@/lib/actions/auth.action';

const CREDIT_PACKS = {
  10: 19,
  100: 99,
  300: 199,
  1000: 599,
};

export async function POST(req: NextRequest) {
  const { credits } = await req.json();
  const user = await getCurrentUser();

  // Ensure credits is a number and a valid key in CREDIT_PACKS
  const creditsNumber = Number(credits);
  if (
    !user ||
    !Number.isInteger(creditsNumber) ||
    !(creditsNumber in CREDIT_PACKS)
  ) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const price = CREDIT_PACKS[creditsNumber as keyof typeof CREDIT_PACKS];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${credits} Credits`,
          },
          unit_amount: price * 100, // Stripe expects paise
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/buy-credits?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/buy-credits?canceled=1`,
    metadata: {
      userId: user.id,
      credits,
    },
  });

  return NextResponse.json({ url: session.url });
} 