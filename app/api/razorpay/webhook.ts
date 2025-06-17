import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/firebase/admin';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature found' }, { status: 400 });
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  try {
    switch (event.event) {
      case 'payment.captured':
        // Handle successful payment
        const { order_id, payment_id } = event.payload.payment.entity;
        
        // Get the order details to know how many credits to add
        const order = await db.collection('orders').doc(order_id).get();
        if (!order.exists) {
          throw new Error('Order not found');
        }
        
        const orderData = order.data();
        const credits = parseInt(orderData?.notes?.credits || '0');
        const userId = orderData?.userId;

        if (!userId || !credits) {
          throw new Error('Invalid order data');
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
        await db.collection('orders').doc(order_id).update({
          status: 'completed',
          payment_id,
          completedAt: new Date().toISOString()
        });
        break;

      case 'payment.failed':
        // Handle failed payment
        const failedOrderId = event.payload.payment.entity.order_id;
        await db.collection('orders').doc(failedOrderId).update({
          status: 'failed',
          failedAt: new Date().toISOString()
        });
        break;

      default:
        console.log('Unhandled event:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 