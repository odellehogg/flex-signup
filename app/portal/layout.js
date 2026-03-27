import Link from 'next/link';
import PortalLogoutButton from '@/components/PortalLogoutButton';

export const metadata = {
  title: 'Member Portal - FLEX',
  description: 'Manage your FLEX subscription, track orders, and view your account.',
};

export default function PortalLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Portal Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/portal" className="text-2xl font-bold text-emerald-600">
              FLEX
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/portal/help"
                className="text-gray-600 hover:text-emerald-600 text-sm"
              >
                Need help?
              </Link>
              <PortalLogoutButton />
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
