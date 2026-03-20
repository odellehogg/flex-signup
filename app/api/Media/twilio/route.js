// app/api/media/twilio/route.js
// ============================================================================
// TWILIO MEDIA PROXY
// Fetches media from Twilio (which requires Basic Auth) and serves it publicly.
// This lets us store a simple URL in Airtable that anyone can open in a browser.
//
// Usage: /api/media/twilio?url=https://api.twilio.com/2010-04-01/Accounts/.../Media/...
// ============================================================================

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const twilioUrl = searchParams.get('url');

  if (!twilioUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Only allow proxying of genuine Twilio media URLs
  if (!twilioUrl.startsWith('https://api.twilio.com/') && !twilioUrl.startsWith('https://media.twiliocdn.com/')) {
    return new Response('Invalid media URL', { status: 403 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return new Response('Twilio credentials not configured', { status: 500 });
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    const response = await fetch(twilioUrl, {
      headers: { 'Authorization': `Basic ${auth}` },
    });

    if (!response.ok) {
      return new Response(`Twilio returned ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24h
      },
    });
  } catch (err) {
    console.error('[TwilioProxy] Failed to fetch media:', err);
    return new Response('Failed to fetch media', { status: 502 });
  }
}
