'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { User } from '@/lib/types';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!auth.isLoggedIn()) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        auth.logout();
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
      <Link href={user?.is_staff ? '/admin' : '/leaves'} className="text-2xl font-bold hover:text-blue-100">
        Leave Management
      </Link>

      {loading ? (
        <Skeleton className="h-10 w-40" />
      ) : user ? (
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Welcome, {user.employee?.full_name || user.username || user.email}</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-blue-500 hover:bg-blue-400 border-blue-400 text-white">
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!user.is_staff && (
                <DropdownMenuItem asChild>
                  <Link href="/leaves/new">New Leave Request</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={user.is_staff ? '/admin' : '/leaves'}>
                  {user.is_staff ? 'Admin Dashboard' : 'My Leaves'}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </nav>
  );
}