import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getMemberById, getMemberDropsRemaining } from '@/lib/airtable';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('flex_auth')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const member = await getMemberById(payload.memberId);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const fields = member.fields;
    return NextResponse.json({
      id: member.id,
      firstName: fields['First Name'],
      lastName: fields['Last Name'],
      email: fields['Email'],
      phone: fields['Phone'],
      plan: fields['Subscription Tier'],
      status: fields['Subscription Status'],
      gym: fields['Gym Name']?.[0] || null,
      dropsAllowed: fields['Drops Allowed'] || 0,
      dropsUsed: fields['Drops Used'] || 0,
      dropsRemaining: getMemberDropsRemaining(fields),
      memberSince: fields['Signup Date'],
      referralCode: fields['Referral Code'],
    });
  } catch (err) {
    console.error('[Portal /me] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
