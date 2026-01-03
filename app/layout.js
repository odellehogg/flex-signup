import './globals.css'

export const metadata = {
  title: 'FLEX | Gym Clothes Laundry Made Easy',
  description: 'Drop off sweaty gym clothes, pick up fresh. 48-hour turnaround at your gym. Subscription plans from £30/month.',
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
      </head>
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
