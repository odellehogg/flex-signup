import { NextResponse } from 'next/server';
import { getMemberByPhone, normalizePhone } from '@/lib/airtable';
import { requestLoginCode } from '@/lib/auth';

export async function POST(request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    // Check if member exists
    const member = await getMemberByPhone(normalizedPhone);
    
    if (!member) {
      // Don't reveal if account exists - just say code sent
      // This prevents enumeration attacks
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this number, a code has been sent.' 
      });
    }

    // Generate and send code
    await requestLoginCode(normalizedPhone, member.id);

    return NextResponse.json({ 
      success: true,
      message: 'Verification code sent to WhatsApp' 
    });
  } catch (err) {
    console.error('Request code error:', err);
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 });
  }
}
