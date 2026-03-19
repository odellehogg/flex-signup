export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getAllDropsByMember } from '@/lib/airtable';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('flex_auth')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const drops = await getAllDropsByMember(payload.memberId);

    const formatted = drops.map(d => ({
      id: d.id,
      bagNumber: d.fields['Bag Number'],
      status: d.fields['Status'],
      dropDate: d.fields['Drop Date'],
      availableUntil: d.fields['Available Until'],
      pickupDate: d.fields['Pickup Date'],
      gym: d.fields['Gym Name (from Gym)']?.[0] || null,
    }));

    return NextResponse.json({ drops: formatted });
  } catch (err) {
    console.error('[Portal /drop] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
