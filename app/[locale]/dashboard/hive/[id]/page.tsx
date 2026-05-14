'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import DashboardShell from '@/components/DashboardShell';
import { getHive, getHiveStats, getInspections, type Hive, type HiveStats, type Inspection } from '@/lib/api';

const VarroaChart = dynamic(() => import('@/components/VarroaChart'), { ssr: false });

export default function HivePage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('dash');
  const [hive, setHive] = useState<Hive | null>(null);
  const [stats, setStats] = useState<HiveStats | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getHive(id), getHiveStats(id), getInspections(id)])
      .then(([h, s, i]) => { setHive(h); setStats(s); setInspections(i.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardShell>
      {hive && (
        <Link href={`/dashboard/apiary/${hive.apiary_id}`} className="dash-back">← {hive.name}</Link>
      )}
      {loading && <div className="spinner" />}
      {!loading && hive && (
        <>
          <h1 className="dash-page-title">{hive.name}</h1>
          <p className="dash-hive-type-label">{hive.hive_type}</p>

          {/* Varroa chart */}
          <h2 className="dash-section-title">{t('hive.varroaTrend')}</h2>
          <div className="dash-chart-box">
            {stats?.varroa_trend.length
              ? <VarroaChart data={stats.varroa_trend} />
              : <p className="dash-empty">{t('hive.noTrend')}</p>}
          </div>

          {/* Inspection table */}
          <h2 className="dash-section-title">{t('hive.inspections')}</h2>
          {inspections.length === 0
            ? <p className="dash-empty">{t('hive.noInspections')}</p>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table className="dash-inspection-table">
                  <thead>
                    <tr>
                      <th>{t('hive.date')}</th>
                      <th>{t('hive.varroa')}</th>
                      <th>{t('hive.mood')}</th>
                      <th>{t('hive.queen')}</th>
                      <th>{t('hive.brood')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspections.map(ins => (
                      <tr key={ins.id}>
                        <td>{new Date(ins.date).toLocaleDateString()}</td>
                        <td>{ins.varroa_count ?? '—'}</td>
                        <td>{ins.mood ?? '—'}</td>
                        <td>{ins.queen_seen == null ? '—' : ins.queen_seen ? t('hive.yes') : t('hive.no')}</td>
                        <td>{ins.brood_frames ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </>
      )}
    </DashboardShell>
  );
}
