import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Create a test order
    const orderData = {
      userId: user.id,
      amount: 10,
      credits: 10,
      status: 'created',
      createdAt: new Date().toISOString(),
      notes: { credits: '10' }
    };

    const orderRef = await db.collection('orders').add(orderData);
    
    return NextResponse.json({ 
      success: true,
      orderId: orderRef.id,
      orderData
    });
  } catch (error) {
    console.error('Error creating test order:', error);
    return NextResponse.json({ 
      error: 'Failed to create test order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 