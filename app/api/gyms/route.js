export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAllGyms, getGymByCode } from '@/lib/airtable';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      const gym = await getGymByCode(code);
      if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
      return NextResponse.json({
        gym: {
          id: gym.id,
          code: gym.fields['Slug'],
          name: gym.fields['Name'],
          address: gym.fields['Address'],
          postcode: gym.fields['Postcode'],
          collectionDays: gym.fields['Collection Days'],
        },
      });
    }

    const gyms = await getAllGyms();
    return NextResponse.json({
      gyms: gyms.map(g => ({
        id: g.id,
        code: g.fields['Slug'],
        name: g.fields['Name'],
        address: g.fields['Address'],
        postcode: g.fields['Postcode'],
      })),
    });
  } catch (err) {
    console.error('[Gyms API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch gyms' }, { status: 500 });
  }
}
