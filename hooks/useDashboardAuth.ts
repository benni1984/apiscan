'use client';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { getMe, clearTokens, type User } from '@/lib/api';

export function useDashboardAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/dashboard/login');
      return;
    }
    getMe()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => { clearTokens(); router.replace('/dashboard/login'); });
  }, [router]);

  return { user, loading };
}
