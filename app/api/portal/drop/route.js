// app/api/portal/drop/route.js
// ============================================================================
// PORTAL DROP API
// Creates a drop from the customer portal
// ============================================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getMemberById, 
  updateMember,
  createDrop, 
  validateBag,
  getGymById,
} from '@/lib/airtable';
import { sendDropConfirmed } from '@/lib/whatsapp';
import { verifyToken } from '@/lib/auth';



export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verify session using same pattern as /api/portal/me
    const cookieStore = await cookies();
    const token = cookieStore.get('flex_auth')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get member
    const member = await getMemberById(payload.memberId);
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check member status
    if (member.fields['Status'] !== 'Active') {
      return NextResponse.json(
        { success: false, error: 'Your subscription is not active' },
        { status: 403 }
      );
    }

    // Get bag number from request
    const body = await request.json();
    const { bagNumber } = body;

    if (!bagNumber) {
      return NextResponse.json(
        { success: false, error: 'Bag number is required' },
        { status: 400 }
      );
    }

    // Check drops remaining
    const dropsRemaining = member.fields['Drops Remaining'] || 0;
    if (dropsRemaining <= 0) {
      return NextResponse.json(
        { success: false, error: 'No drops remaining this month' },
        { status: 400 }
      );
    }

    // Validate bag number
    const validation = await validateBag(bagNumber);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.message },
        { status: 400 }
      );
    }

    const { bag, bagNumber: normalizedBagNumber } = validation;

    // Get gym info
    const gymId = member.fields['Gym']?.[0];
    let gymName = 'your gym';
    if (gymId) {
      const gym = await getGymById(gymId);
      gymName = gym?.fields['Name'] || 'your gym';
    }

    // Create the drop
    const drop = await createDrop({
      memberId: member.id,
      bagId: bag.id,
      bagNumber: normalizedBagNumber,
      gymId: gymId,
    });

    // Calculate expected ready date
    const expectedReady = new Date();
    expectedReady.setHours(expectedReady.getHours() + 48);
    const expectedDate = expectedReady.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short' 
    });

    // Update member: decrement drops
    const newDropsRemaining = dropsRemaining - 1;
    await updateMember(member.id, {
      'Drops Remaining': newDropsRemaining,
      'Total Drops': (member.fields['Total Drops'] || 0) + 1,
    });

    // Send WhatsApp confirmation
    const phone = member.fields['Phone'] || member.fields['Phone Number'];
    if (phone) {
      try {
        await sendDropConfirmed(phone, {
          bagNumber: normalizedBagNumber,
          gymName,
          expectedDate,
        });
      } catch (whatsappError) {
        console.error('Failed to send drop WhatsApp:', whatsappError);
        // Don't fail the request if WhatsApp fails
      }
    }

    console.log(`[Portal] Drop created: ${drop.id} | Bag: ${normalizedBagNumber} | Member: ${member.id}`);

    return NextResponse.json({
      success: true,
      dropId: drop.id,
      bagNumber: normalizedBagNumber,
      expectedDate,
      dropsRemaining: newDropsRemaining,
    });

  } catch (error) {
    console.error('Error creating portal drop:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create drop' },
      { status: 500 }
    );
  }
}
