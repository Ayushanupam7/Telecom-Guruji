'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/PageLoader';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already signed in -> redirect to active dashboard
    if (user) {
      if (user.role === 'instructor') {
        router.replace('/instructor/dashboard');
      } else if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/student/dashboard');
      }
    } else {
      // First time visitor / not signed in -> redirect to /auth login/signup page
      router.replace('/auth');
    }
  }, [user, router]);

  return <PageLoader />;
}
