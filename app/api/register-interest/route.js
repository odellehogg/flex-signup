// app/api/register-interest/route.js
// Saves gym interest to Airtable 'Gym Interest' table
import { NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export async function POST(request) {
  try {
    const { firstName, lastName, email, gymName, location } = await request.json();

    if (!email || !gymName) {
      return NextResponse.json({ success: false, error: 'Email and gym name required' }, { status: 400 });
    }

    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Gym%20Interest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{
            fields: {
              'Email': email,
              'First Name': firstName || '',
              'Last Name': lastName || '',
              'Gym Name': gymName,
              'Location': location || '',
              'Status': 'New',
              'Source': 'Website',
              'Created': new Date().toISOString(),
            },
          }],
        }),
      }).catch(err => console.error('Airtable gym interest save failed:', err));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Register interest error:', err);
    return NextResponse.json({ success: true }); // Always return success to user
  }
}
