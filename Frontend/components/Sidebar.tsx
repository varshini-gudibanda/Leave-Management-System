'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, FileText, PlusCircle, Users, Settings, ChevronRight, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.isLoggedIn()) {
        try {
          const user = await apiClient.getCurrentUser();
          setIsAdmin(user.is_staff);
        } catch (error) {
          setIsAdmin(false);
        }
      }
    };
    checkAdmin();
  }, []);

  const navigationItems = isAdmin
    ? [
        { name: 'All Leave Requests', href: '/admin', icon: FileText },
        { name: 'Register Employee', href: '/auth/register', icon: UserPlus },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    : [
        { name: 'Leave Requests', href: '/leaves', icon: FileText },
        { name: 'New Request', href: '/leaves/new', icon: PlusCircle },
        { name: 'Settings', href: '/settings', icon: Settings },
      ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Company Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Wakefit</h2>
            <p className="text-xs text-gray-500">Furniture, Mattress and Home Decor</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Navigation
          </p>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-700">V</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Varshini</p>
            <p className="text-xs text-gray-500 truncate">{isAdmin ? 'Admin' : 'Employee'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
