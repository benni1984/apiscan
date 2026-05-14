'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { logout } from '@/lib/api';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';

export default function DashboardShell({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
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

  if (adminOnly && !user.is_admin) {
    router.replace('/dashboard');
    return null;
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
            {user.is_admin && (
              <>
                <div className="dash-nav-section">{t('admin.nav.section')}</div>
                <Link href="/dashboard/admin" className="dash-nav-link">{t('admin.nav.stats')}</Link>
                <Link href="/dashboard/admin/users" className="dash-nav-link">{t('admin.nav.users')}</Link>
                <Link href="/dashboard/admin/map" className="dash-nav-link">{t('admin.nav.map')}</Link>
                <Link href="/dashboard/admin/health" className="dash-nav-link">{t('admin.nav.health')}</Link>
              </>
            )}
          </nav>
          <button className="dash-logout" onClick={handleLogout}>{t('nav.logout')}</button>
        </aside>
        <main className="dash-main">{children}</main>
      </div>
    </div>
  );
}
