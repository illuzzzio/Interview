import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(req: NextRequest) {
  const { credits, amount } = await req.json();
  if (!credits || !amount) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: { credits: String(credits) },
    });

    // Store order in database
    await db.collection('orders').doc(order.id).set({
      userId: user.id,
      amount: amount,
      credits: credits,
      status: 'created',
      createdAt: new Date().toISOString(),
      notes: { credits: String(credits) }
    });

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
} 