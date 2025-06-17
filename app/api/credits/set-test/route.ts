import { NextResponse } from 'next/server';
import { setCurrentUserCredits } from '@/lib/actions/auth.action';

export async function POST() {
  const success = await setCurrentUserCredits(100);
  return NextResponse.json({ success });
} 