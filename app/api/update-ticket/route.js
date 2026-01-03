/**
 * FLEX Support Ticket Update API
 * 
 * Called from Ops Dashboard when ticket status changes
 * Notifies user via WhatsApp and email
 * 
 * Endpoint: POST /api/update-ticket
 */

import { NextResponse } from 'next/server';
import { notifyTicketUpdate } from '@/lib/support.js';
import { getIssueByTicketId } from '@/lib/airtable.js';
import { updateIssueStatus } from '@/lib/airtable.js';

// Auth token for Ops Dashboard
const OPS_AUTH_TOKEN = process.env.OPS_AUTH_TOKEN;

export async function POST(request) {
  const startTime = Date.now();

  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (OPS_AUTH_TOKEN && authHeader !== `Bearer ${OPS_AUTH_TOKEN}`) {
      console.error('[UpdateTicket] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    console.log('[UpdateTicket] Received:', body);

    const { ticketId, status, response: responseMessage, notes } = body;

    // Validate required fields
    if (!ticketId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: ticketId, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['Open', 'In Progress', 'Awaiting Customer', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get current ticket to verify it exists
    const ticket = await getIssueByTicketId(ticketId);
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Update status in Airtable
    const updateResult = await updateIssueStatus(ticket.id, status, notes);
    if (!updateResult) {
      return NextResponse.json(
        { error: 'Failed to update ticket status' },
        { status: 500 }
      );
    }

    // Notify user (WhatsApp + email)
    const notifyResult = await notifyTicketUpdate(ticketId, status, responseMessage);

    const duration = Date.now() - startTime;

    console.log(`[UpdateTicket] Updated (${duration}ms):`, {
      ticketId,
      oldStatus: ticket.status,
      newStatus: status,
      notified: notifyResult.success
    });

    return NextResponse.json({
      success: true,
      data: {
        ticketId,
        previousStatus: ticket.status,
        newStatus: status,
        userNotified: notifyResult.success
      },
      duration
    });

  } catch (error) {
    console.error('[UpdateTicket] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET handler for testing endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'Ticket update endpoint active',
    usage: 'POST with { ticketId, status, response?, notes? }',
    validStatuses: ['Open', 'In Progress', 'Awaiting Customer', 'Resolved', 'Closed']
  });
}
