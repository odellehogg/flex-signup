import './globals.css';

export const metadata = {
  title: 'FLEX - Gym Clothes Laundry Service',
  description: 'Drop your sweaty gym clothes at the gym, we clean and return within 48 hours. Subscription laundry for fitness enthusiasts.',
  keywords: 'gym laundry, activewear cleaning, fitness laundry service, gym clothes subscription',
  openGraph: {
    title: 'FLEX - Gym Clothes Laundry Service',
    description: 'Sweat Less, Live More. Professional gym clothes laundry with 48-hour turnaround.',
    url: 'https://flexlaundry.co.uk',
    siteName: 'FLEX',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
