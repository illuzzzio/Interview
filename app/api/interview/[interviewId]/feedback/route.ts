import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getFeedbackByInterviewId } from '@/lib/actions/general.action';
import { db } from '@/firebase/admin';

export async function GET(req: NextRequest, { params }: { params: { interviewId: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const feedback = await getFeedbackByInterviewId({ interviewId: params.interviewId, userId: user.id });
  return NextResponse.json({ feedback });
}

export async function DELETE(req: NextRequest, { params }: { params: { interviewId: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  // Find the feedback document
  const feedbackSnap = await db.collection('feedback')
    .where('interviewId', '==', params.interviewId)
    .where('userId', '==', user.id)
    .limit(1)
    .get();
  if (feedbackSnap.empty) {
    return NextResponse.json({ success: false, error: 'No feedback found' }, { status: 404 });
  }
  const docId = feedbackSnap.docs[0].id;
  await db.collection('feedback').doc(docId).delete();
  return NextResponse.json({ success: true });
} 