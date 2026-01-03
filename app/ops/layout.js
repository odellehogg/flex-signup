import Link from 'next/link';

export const metadata = {
  title: 'Ops Dashboard - FLEX',
  description: 'FLEX operations dashboard for managing members, drops, and support tickets.',
};

export default function OpsLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Ops Header */}
      <header className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/ops" className="text-2xl font-bold">
                FLEX <span className="text-emerald-400 text-sm font-normal">OPS</span>
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/ops" className="hover:text-emerald-400 transition-colors">
                  Dashboard
                </Link>
                <Link href="/ops/members" className="hover:text-emerald-400 transition-colors">
                  Members
                </Link>
                <Link href="/ops/drops" className="hover:text-emerald-400 transition-colors">
                  Drops
                </Link>
                <Link href="/ops/tickets" className="hover:text-emerald-400 transition-colors">
                  Tickets
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-300 hover:text-white">
                View Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
