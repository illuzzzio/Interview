import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { credits, amount } = body;
    console.log('Received order request:', { credits, amount });

    if (!credits || !amount) {
      console.error('Invalid request: missing credits or amount');
      return NextResponse.json({ error: 'Invalid request: missing credits or amount' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials missing:', {
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET
      });
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log('Creating Razorpay order...');
    try {
      const order = await razorpay.orders.create({
        amount: amount * 100, // amount in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        payment_capture: true,
        notes: { credits: String(credits) }
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
    } catch (razorpayError: any) {
      console.error('Razorpay API error:', {
        error: razorpayError,
        message: razorpayError.message,
        statusCode: razorpayError.statusCode,
        error_description: razorpayError.error_description
      });
      return NextResponse.json({ 
        error: 'Failed to create Razorpay order',
        details: razorpayError.error_description || razorpayError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ 
      error: 'Failed to create Razorpay order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 