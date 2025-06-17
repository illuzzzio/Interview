import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(req: NextRequest) {
  try {
    const { credits, amount } = await req.json();
    console.log('Received order request:', { credits, amount });

    if (!credits || !amount) {
      console.error('Invalid request: missing credits or amount');
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials missing');
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log('Creating Razorpay order...');
    const order = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: true,
      notes: { credits: String(credits) },
    });
    console.log('Razorpay order created:', order);

    // Store order in database
    console.log('Storing order in database...');
    await db.collection('orders').doc(order.id).set({
      userId: user.id,
      amount: amount,
      credits: credits,
      status: 'created',
      createdAt: new Date().toISOString(),
      notes: { credits: String(credits) }
    });
    console.log('Order stored in database');

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
} 