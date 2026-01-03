import { NextResponse } from 'next/server';
import { sendReadyPickup } from '@/lib/whatsapp';
import { sendReadyForPickupEmail } from '@/lib/email';

// This endpoint is called by Airtable automation when drop status changes to "Ready"
export async function POST(request) {
  try {
    // Verify request (simple API key check)
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.CMS_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      bagNumber,
      memberPhone,
      memberEmail,
      memberName,
      gymName,
      status,
    } = await request.json();

    if (status !== 'Ready') {
      return NextResponse.json({ 
        success: true, 
        message: 'No notification needed for this status' 
      });
    }

    if (!memberPhone && !memberEmail) {
      return NextResponse.json({ 
        error: 'No contact information provided' 
      }, { status: 400 });
    }

    // Calculate pickup deadline
    const pickupDeadline = new Date();
    pickupDeadline.setDate(pickupDeadline.getDate() + 7);
    const availableUntil = pickupDeadline.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });

    const results = { whatsapp: null, email: null };

    // Send WhatsApp
    if (memberPhone) {
      try {
        await sendReadyPickup(memberPhone, {
          bagNumber,
          gymName: gymName || 'your gym',
          availableUntil,
        });
        results.whatsapp = 'sent';
      } catch (err) {
        console.error('WhatsApp notification failed:', err);
        results.whatsapp = 'failed';
      }
    }

    // Send email
    if (memberEmail) {
      try {
        await sendReadyForPickupEmail({
          to: memberEmail,
          firstName: memberName?.split(' ')[0] || 'there',
          bagNumber,
          gymName: gymName || 'your gym',
        });
        results.email = 'sent';
      } catch (err) {
        console.error('Email notification failed:', err);
        results.email = 'failed';
      }
    }

    return NextResponse.json({
      success: true,
      notifications: results,
    });
  } catch (err) {
    console.error('Drop notification error:', err);
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}
