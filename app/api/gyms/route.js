export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAllGyms, getGymByCode } from '@/lib/airtable';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      // Get specific gym by code
      const gym = await getGymByCode(code);
      
      if (!gym) {
        return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
      }

      return NextResponse.json({
        gym: {
          id: gym.id,
          code: gym.fields['Code'],
          name: gym.fields['Name'],
          address: gym.fields['Address'],
          collectionDays: gym.fields['Collection Days'],
        },
      });
    }

    // Get all active gyms
    const gyms = await getAllGyms();

    return NextResponse.json({
      gyms: gyms
        .filter(g => g.fields['Status'] === 'Active')
        .map(g => ({
          id: g.id,
          code: g.fields['Code'],
          name: g.fields['Name'],
          address: g.fields['Address'],
        })),
    });
  } catch (err) {
    console.error('Gyms API error:', err);
    return NextResponse.json({ error: 'Failed to fetch gyms' }, { status: 500 });
  }
}
