/**
 * FLEX Drop Status Notification API
 * 
 * Called by Airtable automation when drop status changes to "Ready"
 * Sends WhatsApp notification to member
 * 
 * Endpoint: POST /api/notify-drop-status
 */

import { NextResponse } from 'next/server';
import * as whatsapp from '@/lib/whatsapp.js';
import * as airtable from '@/lib/airtable.js';

// Simple auth token to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request) {
  const startTime = Date.now();

  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.error('[NotifyDrop] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    console.log('[NotifyDrop] Received:', body);

    const { dropId, bagNumber, status, memberId } = body;

    // Validate required fields
    if (!dropId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: dropId, status' },
        { status: 400 }
      );
    }

    // Only send notifications for "Ready" status
    if (status !== 'Ready') {
      console.log('[NotifyDrop] Status is not Ready, skipping notification');
      return NextResponse.json({ 
        success: true, 
        message: 'No notification needed for this status' 
      });
    }

    // Get drop details if not provided
    let drop;
    if (bagNumber) {
      drop = { bagNumber, status };
    } else {
      drop = await airtable.getDropByBagNumber(dropId);
      if (!drop) {
        return NextResponse.json(
          { error: 'Drop not found' },
          { status: 404 }
        );
      }
    }

    // Get member
    let member;
    if (memberId) {
      member = await airtable.getMemberById(memberId);
    } else if (drop.memberId) {
      member = await airtable.getMemberById(drop.memberId);
    }

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Calculate availability (48 hours from now by default)
    const availableUntil = calculateAvailability();
    const gymName = drop.gymName || member.gymName || 'your gym';

    // Send Ready for Pickup notification
    const result = await whatsapp.sendReadyPickup(
      member.phone,
      drop.bagNumber,
      gymName,
      availableUntil
    );

    const duration = Date.now() - startTime;

    if (!result.success) {
      console.error('[NotifyDrop] Failed to send notification:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          duration 
        },
        { status: 500 }
      );
    }

    console.log(`[NotifyDrop] Notification sent (${duration}ms):`, {
      member: member.firstName,
      bag: drop.bagNumber,
      gym: gymName
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      data: {
        memberId: member.id,
        bagNumber: drop.bagNumber,
        messageSid: result.sid
      },
      duration
    });

  } catch (error) {
    console.error('[NotifyDrop] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Calculate availability window
 * Returns formatted string like "Friday 8pm"
 */
function calculateAvailability() {
  const now = new Date();
  // Default: available for 48 hours
  const availableUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[availableUntil.getDay()];
  
  // Round to nearest reasonable time (gym closing)
  let hour = availableUntil.getHours();
  if (hour > 20) hour = 20; // Cap at 8pm
  if (hour < 6) hour = 20; // If early morning, show previous day's closing
  
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  
  return `${dayName} ${hour12}${ampm}`;
}

/**
 * GET handler for testing endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'Drop notification endpoint active',
    usage: 'POST with { dropId, status, memberId?, bagNumber? }'
  });
}
