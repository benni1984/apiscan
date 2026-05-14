'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { getApiaries, type Apiary } from '@/lib/api';

export default function DashboardPage() {
  const t = useTranslations('dash');
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApiaries()
      .then(data => setApiaries(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <h1 className="dash-page-title">{t('apiaries.title')}</h1>
      {loading && <div className="spinner" />}
      {!loading && apiaries.length === 0 && (
        <p className="dash-empty">{t('apiaries.empty')}</p>
      )}
      {!loading && apiaries.length > 0 && (
        <div className="dash-card-grid">
          {apiaries.map(a => (
            <Link key={a.id} href={`/dashboard/apiary/${a.id}`} className="dash-apiary-card">
              <h3>{a.name}</h3>
              <p className="dash-card-meta">
                🐝 {a.hive_count} {t('apiaries.hives')}
                <span className={`dash-badge ${a.is_public ? 'dash-badge-public' : 'dash-badge-private'}`}>
                  {a.is_public ? t('apiaries.public') : t('apiaries.private')}
                </span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
