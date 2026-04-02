import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata = {
  title: 'FLEX | Gym Clothes Laundry Made Easy',
  description: 'Drop off sweaty gym clothes, pick up fresh. 48-hour turnaround at your gym. Subscription plans from £42/month.',
  keywords: 'gym laundry, activewear cleaning, fitness laundry service, gym clothes wash',
  openGraph: {
    title: 'FLEX | Gym Clothes Laundry Made Easy',
    description: 'Drop off sweaty gym clothes, pick up fresh. 48-hour turnaround at your gym.',
    url: 'https://flexlaundry.co.uk',
    siteName: 'FLEX',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FLEX | Gym Clothes Laundry Made Easy',
    description: 'Drop off sweaty gym clothes, pick up fresh. 48-hour turnaround at your gym.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-flex-card text-flex-black antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
