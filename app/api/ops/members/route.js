export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Simple auth check - in production use proper auth middleware
function checkOpsAuth() {
  const headersList = headers();
  const authToken = headersList.get('x-ops-token');
  
  // For now, allow all requests in development
  // In production, implement proper authentication
  if (process.env.NODE_ENV === 'production' && authToken !== process.env.OPS_AUTH_TOKEN) {
    return false;
  }
  return true;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    let filterFormula = '';
    if (status) {
      filterFormula = `{Status} = "${status}"`;
    }

    const params = new URLSearchParams({
      pageSize: Math.min(limit, 100).toString(),
      sort: JSON.stringify([{ field: 'Created', direction: 'desc' }]),
    });

    if (filterFormula) {
      params.set('filterByFormula', filterFormula);
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?${params}`,
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

    const members = data.records.map(r => ({
      id: r.id,
      firstName: r.fields['First Name'],
      lastName: r.fields['Last Name'],
      email: r.fields['Email'],
      phone: r.fields['Phone Number'],
      plan: r.fields['Subscription Tier'],
      status: r.fields['Status'],
      gym: r.fields['Gym Name'],
      dropsRemaining: r.fields['Drops Remaining'],
      totalDrops: r.fields['Total Drops'],
      createdAt: r.createdTime,
    }));

    return NextResponse.json({ members });
  } catch (err) {
    console.error('Ops members error:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
