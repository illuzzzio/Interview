import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getUserCredits, deductUserCredits } from '@/lib/actions/general.action';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const credits = await getUserCredits(user.id);
  if (credits < 10) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
  }
  const success = await deductUserCredits(user.id, 10);
  if (!success) {
    return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 