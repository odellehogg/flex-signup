import { NextResponse } from 'next/server';
import { updateDropStatus } from '@/lib/airtable';
import { sendReadyPickup, sendPlainTextMessage } from '@/lib/whatsapp';
import { sendReadyForPickupEmail } from '@/lib/email';
import { logDropStatusChange } from '@/lib/audit';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 });
    }

    const validStatuses = ['Dropped', 'In Transit', 'At Laundry', 'Ready', 'Collected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update the drop
    const drop = await updateDropStatus(id, status);

    // Log audit
    await logDropStatusChange(id, status, { source: 'ops_dashboard' });

    // Send notification if ready
    if (status === 'Ready') {
      const memberPhone = drop.fields['Member Phone'];
      const memberEmail = drop.fields['Member Email'];
      const memberName = drop.fields['Member Name'];
      const bagNumber = drop.fields['Bag Number'];
      const gymName = drop.fields['Gym Name'] || 'your gym';

      // Calculate pickup deadline (7 days)
      const pickupDeadline = new Date();
      pickupDeadline.setDate(pickupDeadline.getDate() + 7);
      const availableUntil = pickupDeadline.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short' 
      });

      // Send WhatsApp notification
      if (memberPhone) {
        try {
          await sendReadyPickup(memberPhone, {
            bagNumber,
            gymName,
            availableUntil,
          });
        } catch (err) {
          console.error('Failed to send WhatsApp ready notification:', err);
        }
      }

      // Send email notification
      if (memberEmail) {
        try {
          await sendReadyForPickupEmail({
            to: memberEmail,
            firstName: memberName?.split(' ')[0] || 'there',
            bagNumber,
            gymName,
          });
        } catch (err) {
          console.error('Failed to send email ready notification:', err);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      drop: {
        id: drop.id,
        status: drop.fields['Status'],
      },
    });
  } catch (err) {
    console.error('Update drop error:', err);
    return NextResponse.json({ error: 'Failed to update drop' }, { status: 500 });
  }
}
