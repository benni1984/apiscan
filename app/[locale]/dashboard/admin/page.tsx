'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { adminGetStats, adminGetTokenStats, type PlatformStats, type TokenStats } from '@/lib/api';

const PRESETS = ['30d', '90d', '365d', 'all'] as const;
type Preset = typeof PRESETS[number];

export default function AdminStatsPage() {
  const t = useTranslations('dash');
  const [preset, setPreset] = useState<Preset>('30d');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tokens, setTokens] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([adminGetStats(preset), adminGetTokenStats()])
      .then(([s, t]) => { setStats(s); setTokens(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preset]);

  return (
    <DashboardShell adminOnly>
      <h1 className="dash-page-title">{t('admin.stats.title')}</h1>

      <div className="dash-admin-preset-row">
        {PRESETS.map(p => (
          <button
            key={p}
            className={`dash-admin-preset-btn${preset === p ? ' active' : ''}`}
            onClick={() => setPreset(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && stats && tokens && (
        <>
          <div className="dash-stat-row" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
            <StatPill label={t('admin.stats.totalUsers')} value={stats.total_users} />
            <StatPill label={t('admin.stats.newUsers')} value={stats.new_users_in_period} />
            <StatPill label={t('admin.stats.supporters')} value={stats.supporter_count} />
            <StatPill label={t('admin.stats.activeUsers')} value={stats.active_users_30d} />
            <StatPill label={t('admin.stats.totalApiaries')} value={stats.total_apiaries} />
            <StatPill label={t('admin.stats.publicApiaries')} value={stats.public_apiaries} />
            <StatPill label={t('admin.stats.totalHives')} value={stats.total_hives} />
            <StatPill label={t('admin.stats.totalInspections')} value={stats.total_inspections} />
            <StatPill label={t('admin.stats.activeSessions')} value={tokens.total_active_sessions} />
          </div>

          <h2 className="dash-section-title">Signups by day</h2>
          {stats.signups_by_day.length === 0 ? (
            <p className="dash-empty">{t('admin.health.noData')}</p>
          ) : (
            <div className="dash-admin-signups">
              {stats.signups_by_day.slice(-30).map(row => (
                <div key={row.date} className="dash-admin-signup-row">
                  <span className="dash-admin-signup-date">{row.date}</span>
                  <div className="dash-admin-signup-bar" style={{ width: `${Math.min(row.count * 8, 200)}px` }} />
                  <span className="dash-admin-signup-count">{row.count}</span>
                </div>
              ))}
            </div>
          )}

          <div className="dash-admin-links">
            <Link href="/dashboard/admin/users" className="dash-admin-link-card">{t('admin.nav.users')}</Link>
            <Link href="/dashboard/admin/map" className="dash-admin-link-card">{t('admin.nav.map')}</Link>
            <Link href="/dashboard/admin/health" className="dash-admin-link-card">{t('admin.nav.health')}</Link>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="dash-stat-pill">
      <span className="num">{value.toLocaleString()}</span>
      <span className="lbl">{label}</span>
    </div>
  );
}
