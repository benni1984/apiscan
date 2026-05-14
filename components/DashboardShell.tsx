'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { logout } from '@/lib/api';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useDashboardAuth();
  const router = useRouter();
  const t = useTranslations('dash');

  async function handleLogout() {
    await logout();
    router.replace('/dashboard/login');
  }

  if (loading || !user) {
    return (
      <div className="dash-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dash-overlay">
      <div className="dash-shell">
        <aside className="dash-sidebar">
          <Link href="/" className="dash-logo">🐝 Api<strong>Scan</strong></Link>
          <div className="dash-user">
            <div className="dash-user-name">{user.name}</div>
            <div className="dash-user-email">{user.email}</div>
          </div>
          <nav className="dash-nav">
            <Link href="/dashboard" className="dash-nav-link">{t('nav.apiaries')}</Link>
          </nav>
          <button className="dash-logout" onClick={handleLogout}>{t('nav.logout')}</button>
        </aside>
        <main className="dash-main">{children}</main>
      </div>
    </div>
  );
}
