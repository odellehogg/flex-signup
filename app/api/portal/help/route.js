export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getMemberById, createIssue } from '@/lib/airtable';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('flex_auth')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const member = await getMemberById(payload.memberId);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const { topic, message } = await request.json();
    if (!topic || !message) {
      return NextResponse.json({ error: 'Topic and message are required' }, { status: 400 });
    }

    await createIssue({
      memberId: member.id,
      type: 'Support Request',
      description: `Topic: ${topic}\n\n${message}`,
    });

    return NextResponse.json({ success: true, message: 'Support request submitted' });
  } catch (err) {
    console.error('[Portal /help] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
