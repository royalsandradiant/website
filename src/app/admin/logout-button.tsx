'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-background/60 hover:bg-primary hover:text-primary-foreground transition-colors"
    >
      <LogOut className="h-5 w-5" />
      Sign Out
    </button>
  );
}
