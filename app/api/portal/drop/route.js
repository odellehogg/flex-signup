export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getAllDropsByMember, getMemberById, validateBag, createDrop, updateMember } from '@/lib/airtable';
import { sendDropConfirmed } from '@/lib/whatsapp';

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

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('flex_auth')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const member = await getMemberById(payload.memberId);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const { bagNumber } = await request.json();
    if (!bagNumber) {
      return NextResponse.json({ error: 'Bag number is required' }, { status: 400 });
    }

    // Check drops remaining
    const dropsAllowed = member.fields['Drops Allowed'] || 0;
    const dropsUsed = member.fields['Drops Used'] || 0;
    if (dropsAllowed - dropsUsed <= 0) {
      return NextResponse.json({ error: 'No drops remaining this month' }, { status: 400 });
    }

    // Validate bag
    const validation = await validateBag(bagNumber);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message || validation.error }, { status: 400 });
    }

    const gymId = member.fields['Gym']?.[0];

    // Create drop
    await createDrop({
      memberId: member.id,
      bagId: validation.bag.id,
      bagNumber: validation.bagNumber,
      gymId,
    });

    // Increment drops used
    await updateMember(member.id, {
      'Drops Used': dropsUsed + 1,
    });

    // Calculate expected date
    const expectedReady = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const expectedDate = expectedReady.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: 'Europe/London',
    });

    const dropsRemaining = dropsAllowed - dropsUsed - 1;
    const gymName = member.fields['Gym Name']?.[0] || 'your gym';

    // Send WhatsApp confirmation
    const phone = member.fields['Phone'];
    if (phone) {
      await sendDropConfirmed(phone, {
        bagNumber: validation.bagNumber,
        gymName,
        expectedDate,
        dropsRemaining,
      }).catch(err => console.error('[Portal /drop] WhatsApp confirmation failed:', err.message));
    }

    // Send drop confirmation email
    const email = member.fields['Email'];
    if (email) {
      const { sendDropConfirmationEmail } = await import('@/lib/email');
      await sendDropConfirmationEmail({
        to: email,
        firstName: member.fields['First Name'] || 'there',
        bagNumber: validation.bagNumber,
        gymName,
      }).catch(err => console.error('[Portal /drop] Confirmation email failed:', err.message));
    }

    // Notify ops about new drop
    const { sendOpsNewDropEmail } = await import('@/lib/email');
    await sendOpsNewDropEmail({
      memberName: member.fields['First Name'] || 'Unknown',
      memberPhone: member.fields['Phone'] || '',
      bagNumber: validation.bagNumber,
      gymName,
    }).catch(err => console.error('[Portal /drop] Ops drop email failed:', err.message));

    return NextResponse.json({
      success: true,
      bagNumber: validation.bagNumber,
      expectedDate,
      dropsRemaining,
    });
  } catch (err) {
    console.error('[Portal /drop POST] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
