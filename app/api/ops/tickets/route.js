export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'Open';
    const limit = parseInt(searchParams.get('limit') || '100');

    const filterFormula = `{Status} = "${status}"`;

    const params = new URLSearchParams({
      pageSize: Math.min(limit, 100).toString(),
      filterByFormula: filterFormula,
    });
    params.append('sort[0][field]', 'Created At');
    params.append('sort[0][direction]', 'desc');

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Issues?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable error: ${response.status}`);
    }

    const data = await response.json();

    const tickets = data.records.map(r => ({
      id: r.id,
      type: r.fields['Type'],
      description: r.fields['Description'],
      status: r.fields['Status'],
      priority: r.fields['Priority'] || 'Normal',
      memberName: r.fields['Member Name']?.[0] || '',
      memberPhone: r.fields['Member Phone']?.[0] || '',
      photoUrl: r.fields['Photo URL'],
      internalNotes: r.fields['Internal Notes'] || '',
      createdAt: r.createdTime,
    }));

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error('Ops tickets error:', err);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}
