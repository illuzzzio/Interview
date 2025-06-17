import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Create a test webhook payload
    const testPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            order_id: 'order_test123',
            payment_id: 'pay_test123',
            amount: 1000,
            currency: 'INR',
            status: 'captured'
          }
        }
      }
    };

    // Convert payload to string
    const body = JSON.stringify(testPayload);

    // Create signature using webhook secret
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    // Make request to your webhook endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/razorpay/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: body
    });

    const result = await response.json();
    return NextResponse.json({ 
      success: response.ok,
      status: response.status,
      result 
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ 
      error: 'Failed to test webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 