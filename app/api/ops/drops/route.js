export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    let filterFormula = '';
    if (status) {
      filterFormula = `{Status} = "${status}"`;
    } else {
      // By default, show non-collected drops
      filterFormula = `{Status} != "Collected"`;
    }

    const params = new URLSearchParams({
      pageSize: Math.min(limit, 100).toString(),
      filterByFormula: filterFormula,
    });
    params.append('sort[0][field]', 'Drop Date');
    params.append('sort[0][direction]', 'desc');

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Drops?${params}`,
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

    const drops = data.records.map(r => ({
      id: r.id,
      bagNumber: r.fields['Bag Number'],
      status: r.fields['Status'],
      dropDate: r.fields['Drop Date'],
      availableUntil: r.fields['Available Until'],
      memberName: r.fields['Member Name'],
      memberPhone: r.fields['Member Phone'],
      gym: r.fields['Gym Name'],
      createdAt: r.createdTime,
    }));

    return NextResponse.json({ drops });
  } catch (err) {
    console.error('Ops drops error:', err);
    return NextResponse.json({ error: 'Failed to fetch drops' }, { status: 500 });
  }
}
