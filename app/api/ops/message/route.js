import { NextResponse } from 'next/server';
import { sendMessage } from '@/lib/whatsapp';

export async function POST(request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 });
    }

    await sendMessage(phone, message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Ops /message] Error:', err.message);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
