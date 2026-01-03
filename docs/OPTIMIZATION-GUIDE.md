# FLEX Optimization Guide

Complete guide to optimizing the FLEX platform for performance, reliability, and scalability.

---

## Table of Contents
1. [Performance Optimization](#1-performance-optimization)
2. [Database Optimization](#2-database-optimization)
3. [API Optimization](#3-api-optimization)
4. [WhatsApp Optimization](#4-whatsapp-optimization)
5. [Cost Optimization](#5-cost-optimization)
6. [Security Hardening](#6-security-hardening)
7. [Monitoring & Observability](#7-monitoring--observability)
8. [Scaling Considerations](#8-scaling-considerations)

---

## 1. Performance Optimization

### Next.js Optimization

#### Image Optimization
```javascript
// next.config.js - Already configured
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'dl.airtable.com' },
    { protocol: 'https', hostname: 'v5.airtableusercontent.com' },
  ],
}
```

#### Dynamic Imports for Heavy Components
```javascript
// For ops dashboard charts (if added)
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded" />,
  ssr: false,
});
```

#### Route Segment Config
```javascript
// For static marketing pages
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour

// For dynamic dashboard pages
export const dynamic = 'force-dynamic';
```

### CSS Optimization

#### Tailwind Purging
Already configured in `tailwind.config.js`:
```javascript
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
],
```

#### Critical CSS
For landing page, consider inlining critical CSS:
```javascript
// app/layout.js
<style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
```

### Bundle Optimization

#### Analyze Bundle Size
```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

```bash
ANALYZE=true npm run build
```

---

## 2. Database Optimization

### Airtable Best Practices

#### Batch Requests
```javascript
// lib/airtable.js - Batch updates
export async function batchUpdateRecords(table, updates) {
  // Airtable allows max 10 records per request
  const chunks = [];
  for (let i = 0; i < updates.length; i += 10) {
    chunks.push(updates.slice(i, i + 10));
  }
  
  const results = [];
  for (const chunk of chunks) {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: chunk }),
      }
    );
    const data = await response.json();
    results.push(...data.records);
  }
  return results;
}
```

#### Caching Strategy
```javascript
// lib/cms.js - Already implemented
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

// For high-traffic pages, consider Redis
// npm install ioredis
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function getCachedData(key, fetchFn, ttl = 60) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
```

#### Index-Friendly Queries
```javascript
// GOOD: Uses indexed field
filterByFormula: `{Phone Number} = "${phone}"`

// GOOD: Linked record with FIND
filterByFormula: `FIND('${memberId}', ARRAYJOIN({Member}))`

// BAD: Complex computed formula
filterByFormula: `AND(DATEADD({Created}, 14, 'days') < TODAY(), {Status} = "Active")`
// Better: Add a computed field in Airtable
```

#### Pagination for Large Datasets
```javascript
async function getAllRecords(table, filterFormula = '') {
  let allRecords = [];
  let offset = null;
  
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (filterFormula) params.set('filterByFormula', filterFormula);
    if (offset) params.set('offset', offset);
    
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}?${params}`,
      { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    const data = await response.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);
  
  return allRecords;
}
```

---

## 3. API Optimization

### Response Caching
```javascript
// For public data (gyms list)
export async function GET() {
  const data = await getGyms();
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

### Error Handling Pattern
```javascript
// Consistent error responses
function apiError(message, status = 500, details = null) {
  return NextResponse.json(
    { 
      error: message, 
      ...(details && process.env.NODE_ENV === 'development' && { details })
    },
    { status }
  );
}

// Usage
if (!member) return apiError('Member not found', 404);
```

### Request Validation
```javascript
// Consider using zod for validation
import { z } from 'zod';

const checkoutSchema = z.object({
  planId: z.enum(['oneoff', 'essential', 'unlimited']),
  email: z.string().email(),
  phone: z.string().min(10),
  gymCode: z.string().optional(),
});

export async function POST(request) {
  const body = await request.json();
  
  const result = checkoutSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: result.error.issues },
      { status: 400 }
    );
  }
  
  // Proceed with validated data
  const { planId, email, phone, gymCode } = result.data;
}
```

### Rate Limiting
```javascript
// Simple in-memory rate limiting (use Redis for production)
const rateLimit = new Map();

function checkRateLimit(key, limit = 10, window = 60000) {
  const now = Date.now();
  const record = rateLimit.get(key) || { count: 0, resetAt: now + window };
  
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + window;
  }
  
  record.count++;
  rateLimit.set(key, record);
  
  return record.count <= limit;
}

// Usage in API route
export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!checkRateLimit(`checkout:${ip}`, 5, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  // Continue...
}
```

---

## 4. WhatsApp Optimization

### Template vs Plain Text Decision Tree
```
Is it a business-initiated message (not reply)?
├── Yes → Must use template (Meta requirement)
│   ├── Template configured and working?
│   │   ├── Yes → Send template
│   │   └── No → Send plain text fallback (within 24hr window)
│   └── Outside 24hr window? → Can only send template
└── No (replying within 24hr) → Can use plain text freely
```

### Message Queue for Reliability
```javascript
// For high-volume scenarios, consider a queue
// lib/whatsapp-queue.js

const messageQueue = [];
let isProcessing = false;

export function queueMessage(phone, template, variables) {
  messageQueue.push({ phone, template, variables, attempts: 0 });
  processQueue();
}

async function processQueue() {
  if (isProcessing || messageQueue.length === 0) return;
  
  isProcessing = true;
  
  while (messageQueue.length > 0) {
    const message = messageQueue[0];
    
    try {
      await sendWhatsAppMessage(message.phone, message.template, message.variables);
      messageQueue.shift(); // Remove on success
    } catch (err) {
      message.attempts++;
      if (message.attempts >= 3) {
        console.error('Message failed after 3 attempts:', message);
        messageQueue.shift(); // Remove failed message
      } else {
        // Move to end of queue for retry
        messageQueue.push(messageQueue.shift());
        await new Promise(r => setTimeout(r, 1000)); // Wait before retry
      }
    }
  }
  
  isProcessing = false;
}
```

### Conversation State Cleanup
```javascript
// Cron job to reset stale conversation states
// /api/cron/cleanup-states/route.js

export async function GET(request) {
  // Find members stuck in awaiting states for >1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const staleMembers = await fetchRecords('Members', 
    `AND(
      {Conversation State} != "ACTIVE",
      {State Updated At} < "${oneHourAgo}"
    )`
  );
  
  for (const member of staleMembers) {
    await updateMember(member.id, { 
      'Conversation State': 'ACTIVE',
      'Pending Issue Type': '',
      'Pending Description': '',
    });
  }
  
  return NextResponse.json({ reset: staleMembers.length });
}
```

---

## 5. Cost Optimization

### Vercel
| Optimization | Savings |
|--------------|---------|
| Edge functions for simple routes | ~50% execution time |
| Static page generation | No function invocations |
| ISR for semi-dynamic pages | Reduced API calls |
| Proper caching headers | Reduced bandwidth |

### Airtable
| Optimization | Impact |
|--------------|--------|
| Batch API calls | Fewer requests |
| Cache frequently accessed data | Reduced API calls |
| Use views for filtered queries | Faster responses |
| Archive old records | Smaller base |

### Twilio
| Optimization | Savings |
|--------------|---------|
| Use templates (vs. session messages) | Lower per-message cost |
| Batch notifications | Fewer API calls |
| Implement delivery receipts | Avoid retrying delivered messages |

### Stripe
| Optimization | Impact |
|--------------|--------|
| Use webhook caching | Fewer API lookups |
| Batch subscription updates | Fewer API calls |
| Use Customer Portal | No custom UI maintenance |

---

## 6. Security Hardening

### Authentication Improvements
```javascript
// Implement refresh tokens
// lib/auth.js additions

export function generateRefreshToken(memberId) {
  return generateToken(memberId, { expiresIn: '30d', type: 'refresh' });
}

export function refreshAccessToken(refreshToken) {
  const payload = verifyToken(refreshToken);
  if (payload.type !== 'refresh') throw new Error('Invalid token type');
  
  return {
    accessToken: generateToken(payload.memberId, { expiresIn: '7d' }),
    refreshToken: generateRefreshToken(payload.memberId),
  };
}
```

### Input Sanitization
```javascript
// Sanitize all user inputs
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Prevent XSS
    .slice(0, 1000); // Limit length
}
```

### Webhook Verification
```javascript
// Always verify webhook signatures
// Already implemented for Stripe

// Add Twilio signature verification
import twilio from 'twilio';

function verifyTwilioSignature(request, body) {
  const signature = request.headers.get('x-twilio-signature');
  const url = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/whatsapp`;
  
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    body
  );
}
```

### Security Headers
Already configured in `next.config.js`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin

Add more:
```javascript
// next.config.js
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline';",
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
],
```

---

## 7. Monitoring & Observability

### Error Tracking (Sentry)
```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### Logging Strategy
```javascript
// lib/logger.js
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

export function log(level, message, data = {}) {
  if (LOG_LEVELS[level] < MIN_LEVEL) return;
  
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };
  
  console[level](JSON.stringify(entry));
}

// Usage
log('info', 'Drop created', { bagNumber: 'B042', memberId: 'rec123' });
log('error', 'Stripe webhook failed', { error: err.message });
```

### Health Check Endpoint
```javascript
// app/api/health/route.js
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {},
  };
  
  // Check Airtable
  try {
    await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Members?maxRecords=1`, {
      headers: { 'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}` },
    });
    checks.services.airtable = 'ok';
  } catch {
    checks.services.airtable = 'error';
    checks.status = 'degraded';
  }
  
  // Check Stripe
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.prices.list({ limit: 1 });
    checks.services.stripe = 'ok';
  } catch {
    checks.services.stripe = 'error';
    checks.status = 'degraded';
  }
  
  return NextResponse.json(checks, {
    status: checks.status === 'healthy' ? 200 : 503,
  });
}
```

### Key Metrics to Track
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API response time | <500ms | >1000ms |
| Webhook success rate | >99% | <95% |
| WhatsApp delivery rate | >95% | <90% |
| Drop turnaround | <48hrs | >42hrs |
| Error rate | <1% | >3% |

---

## 8. Scaling Considerations

### Current Limits
| Component | Limit | Notes |
|-----------|-------|-------|
| Airtable | 5 requests/sec | Use batching |
| Vercel Functions | 10s (hobby), 60s (pro) | Keep operations fast |
| Twilio | 1 msg/sec per number | Queue for bursts |
| Stripe | 100 req/sec | Usually not an issue |

### Scaling Beyond MVP

#### Database Migration Path
When Airtable limits become constraining:
1. **Supabase/Postgres**: Full SQL, real-time subscriptions
2. **PlanetScale**: MySQL, branching, zero-downtime migrations
3. **MongoDB Atlas**: Document-based, similar to Airtable structure

#### Message Queue
For high-volume notifications:
```javascript
// Use Vercel KV or Upstash Redis
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function queueNotification(type, data) {
  await redis.lpush('notifications', JSON.stringify({ type, data, queuedAt: Date.now() }));
}

// Worker (separate Vercel function or cron)
export async function processNotifications() {
  while (true) {
    const item = await redis.rpop('notifications');
    if (!item) break;
    
    const { type, data } = JSON.parse(item);
    await sendNotification(type, data);
  }
}
```

#### Geographic Distribution
For international expansion:
1. Use Vercel Edge Functions for latency-sensitive routes
2. Consider multi-region database (PlanetScale, CockroachDB)
3. Use regional Twilio numbers

---

## Quick Wins Checklist

### Immediate (Day 1)
- [ ] Enable Vercel Analytics
- [ ] Set up error alerting (email on 500s)
- [ ] Configure proper cache headers
- [ ] Enable Airtable automation for drop notifications

### Short-term (Week 1)
- [ ] Add health check endpoint
- [ ] Implement request logging
- [ ] Set up Sentry or similar
- [ ] Add rate limiting to checkout

### Medium-term (Month 1)
- [ ] Bundle size analysis and optimization
- [ ] Database query optimization
- [ ] Implement Redis caching
- [ ] Add comprehensive monitoring dashboard

---

**Last Updated:** January 2025
