import Link from 'next/link';
import { COMPANY } from '@/lib/constants';

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
              <a 
                href={`https://wa.me/${COMPANY.phone.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-emerald-600 text-sm"
              >
                Need help?
              </a>
              <Link 
                href="/api/portal/logout"
                className="text-gray-600 hover:text-red-600 text-sm"
              >
                Logout
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
