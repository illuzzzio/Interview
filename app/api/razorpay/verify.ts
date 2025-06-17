import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Get the order details
    const order = await db.collection('orders').doc(razorpay_order_id).get();
    if (!order.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = order.data();
    const credits = parseInt(orderData?.notes?.credits || '0');
    const userId = orderData?.userId;

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    // Update user credits
    const userRef = db.collection('users').doc(userId);
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');
      const currentCredits = userDoc.data()?.credits || 0;
      t.update(userRef, { credits: currentCredits + credits });
    });

    // Mark order as completed
    await db.collection('orders').doc(razorpay_order_id).update({
      status: 'completed',
      payment_id: razorpay_payment_id,
      completedAt: new Date().toISOString()
    });

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ 
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 