export async function GET() {
  const baseUrl = 'https://flexlaundry.co.uk';
  
  const staticPages = [
    '',
    '/pricing',
    '/how-it-works',
    '/faq',
    '/partners',
    '/contact',
    '/privacy',
    '/terms',
    '/join',
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
