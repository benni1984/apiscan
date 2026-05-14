'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { getApiary, getHives, getApiaryStats, type Apiary, type Hive, type ApiaryStats } from '@/lib/api';

export default function ApiaryPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('dash');
  const [apiary, setApiary] = useState<Apiary | null>(null);
  const [hives, setHives] = useState<Hive[]>([]);
  const [stats, setStats] = useState<ApiaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getApiary(id), getHives(id), getApiaryStats(id)])
      .then(([a, h, s]) => { setApiary(a); setHives(h.items); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardShell>
      <Link href="/dashboard" className="dash-back">← {t('nav.apiaries')}</Link>
      {loading && <div className="spinner" />}
      {!loading && apiary && (
        <>
          <h1 className="dash-page-title">{apiary.name}</h1>
          {stats && (
            <div className="dash-stat-row">
              <div className="dash-stat-pill">
                <span className="num">{stats.hive_count}</span>
                <span className="lbl">{t('apiary.hives')}</span>
              </div>
              <div className="dash-stat-pill">
                <span className="num">{stats.inspections_total}</span>
                <span className="lbl">{t('apiary.inspections')}</span>
              </div>
              {stats.average_varroa != null && (
                <div className="dash-stat-pill">
                  <span className="num">{stats.average_varroa.toFixed(1)}</span>
                  <span className="lbl">{t('apiary.avgVarroa')}</span>
                </div>
              )}
            </div>
          )}
          <h2 className="dash-section-title">{t('apiary.hives')}</h2>
          {hives.length === 0
            ? <p className="dash-empty">{t('apiary.noHives')}</p>
            : (
              <div className="dash-hive-list">
                {hives.map(h => (
                  <Link key={h.id} href={`/dashboard/hive/${h.id}`} className="dash-hive-card">
                    <span className="dash-hive-icon">🐝</span>
                    <div>
                      <div className="hive-name">{h.name}</div>
                      <div className="hive-type">{h.hive_type}</div>
                    </div>
                    {h.last_inspection_at && (
                      <span className="dash-hive-date">{new Date(h.last_inspection_at).toLocaleDateString()}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
        </>
      )}
    </DashboardShell>
  );
}
