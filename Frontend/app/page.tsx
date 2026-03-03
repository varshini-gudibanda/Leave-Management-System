'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (auth.isLoggedIn()) {
      router.push('/leaves');
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  return null;
}