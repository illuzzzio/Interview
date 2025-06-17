import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { db } from '@/firebase/admin';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0', 10);
    if (userId && credits > 0) {
      const userRef = db.collection('users').doc(userId);
      await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) return;
        const prevCredits = userDoc.data()?.credits || 0;
        t.update(userRef, { credits: prevCredits + credits });
      });
    }
  }

  return NextResponse.json({ received: true });
} 