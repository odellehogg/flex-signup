import { NextResponse } from 'next/server';
import { updateIssue } from '@/lib/airtable';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updates = await request.json();

    const allowedFields = ['Status', 'Priority', 'Resolution', 'Notes'];
    const filteredUpdates = {};

    // Map incoming fields to Airtable fields
    if (updates.status) filteredUpdates['Status'] = updates.status;
    if (updates.priority) filteredUpdates['Priority'] = updates.priority;
    if (updates.resolution) filteredUpdates['Resolution'] = updates.resolution;
    if (updates.notes) filteredUpdates['Notes'] = updates.notes;

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates' }, { status: 400 });
    }

    const ticket = await updateIssue(id, filteredUpdates);

    return NextResponse.json({ 
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.fields['Status'],
        priority: ticket.fields['Priority'],
      },
    });
  } catch (err) {
    console.error('Update ticket error:', err);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
