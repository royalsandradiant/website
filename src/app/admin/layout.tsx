import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, ShoppingCart, LogOut, LayoutDashboard, FolderTree } from 'lucide-react';
import { LogoutButton } from './logout-button';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full flex-none md:w-64 bg-foreground text-background">
        <div className="p-6">
          {/* Brand */}
          <Link href="/admin" className="block mb-8">
            <h1 className="font-display text-xl text-primary-foreground">
              Royals and Radiant
            </h1>
            <span className="text-xs text-background/50">by Upasana and Foram</span>
            <span className="block text-xs tracking-wider text-background/60 uppercase mt-1">
              Admin Dashboard
            </span>
          </Link>

          {/* User Info */}
          <div className="mb-8 pb-6 border-b border-background/10">
            <p className="text-sm text-background/60">Signed in as</p>
            <p className="text-sm font-medium truncate">{session.user.email}</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <Link 
              href="/admin" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-background/80 hover:bg-background/10 hover:text-background transition-colors"
            >
              <Package className="h-5 w-5" />
              Products
            </Link>
            <Link 
              href="/admin/categories" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-background/80 hover:bg-background/10 hover:text-background transition-colors"
            >
              <FolderTree className="h-5 w-5" />
              Categories
            </Link>
            <Link 
              href="/admin/orders" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-background/80 hover:bg-background/10 hover:text-background transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              Orders
            </Link>
          </nav>
        </div>

        {/* Sign Out - Fixed at bottom */}
        <div className="mt-auto p-6 border-t border-background/10">
          <LogoutButton />
          <Link 
            href="/" 
            className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-md text-background/60 hover:bg-background/10 hover:text-background transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            View Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background overflow-y-auto">
        <div className="p-6 md:p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
