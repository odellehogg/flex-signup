# FLEX - Gym Clothes Laundry Service

> Sweat Less, Live More

FLEX is a B2B2C gym clothes laundry subscription service. Members drop sweaty workout clothes at partner gyms, we collect, clean, and return within 48 hours.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Hosting:** Vercel
- **Database:** Airtable
- **Payments:** Stripe
- **Messaging:** Twilio (WhatsApp)
- **Email:** Resend
- **Styling:** Tailwind CSS

## Project Structure

```
├── app/
│   ├── (marketing)/     # Public pages
│   ├── join/            # Signup flow
│   ├── portal/          # Member portal
│   ├── ops/             # Operations dashboard
│   └── api/             # API routes
├── components/          # React components
├── lib/                 # Business logic
└── docs/                # Documentation
```

## Pricing Tiers

| Tier | Price | Drops | Description |
|------|-------|-------|-------------|
| One-Off | £5 | 1 | Trial |
| Essential | £35/mo | 10 | Core plan |
| Unlimited | £48/mo | 16 | Heavy users |

## Key Features

- WhatsApp-based order tracking
- Magic link authentication
- Subscription management (pause/resume/cancel)
- Ops dashboard for drop management
- SLA monitoring and alerts
- Automated re-engagement messages

## Documentation

See `/docs` folder for:
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API-REFERENCE.md)
- [WhatsApp Flows](docs/WHATSAPP-FLOWS.md)
- [Environment Setup](docs/ENV-SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Airtable Setup](docs/AIRTABLE-SETUP.md)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/odellehogg/flex-signup)

## License

Proprietary - FLEX Active Group Limited
