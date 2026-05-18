'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import DashboardShell from '@/components/DashboardShell';
import { getPublicStats, type PublicStats } from '@/lib/api';

const MoodChart = dynamic(() => import('@/components/MoodChart'), { ssr: false });
const CityChart = dynamic(() => import('@/components/CityChart'), { ssr: false });

const SIZE_BUCKETS = [
  { label: '1', test: (n: number) => n === 1 },
  { label: '2–5', test: (n: number) => n >= 2 && n <= 5 },
  { label: '6–10', test: (n: number) => n >= 6 && n <= 10 },
  { label: '11–20', test: (n: number) => n >= 11 && n <= 20 },
  { label: '21+', test: (n: number) => n >= 21 },
];

function buildCityData(apiaries: PublicStats['apiaries'], other: string) {
  const map = new Map<string, number>();
  for (const a of apiaries) {
    const key = a.city_name?.trim() || other;
    map.set(key, (map.get(key) ?? 0) + a.hive_count);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([city, hives]) => ({ city, hives }));
}

function buildSizeData(apiaries: PublicStats['apiaries']) {
  return SIZE_BUCKETS.map(b => ({
    label: b.label,
    count: apiaries.filter(a => b.test(a.hive_count)).length,
  }));
}

function SizeChart({ data }: { data: { label: string; count: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    let chart: { destroy(): void } | undefined;
    import('chart.js/auto').then(({ Chart }) => {
      if (!canvasRef.current) return;
      chart = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: data.map(d => d.label),
          datasets: [{
            data: data.map(d => d.count),
            backgroundColor: '#166534',
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { title: { display: true, text: 'Hives per apiary' } },
          },
        },
      });
    });
    return () => { chart?.destroy(); };
  }, [data]);
  return <canvas ref={canvasRef} />;
}

export default function MembersDashboardPage() {
  const t = useTranslations('dash');
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const calmPct = stats
    ? (() => {
        const dist = stats.mood_distribution ?? {};
        const total = Object.values(dist).reduce((a, b) => a + b, 0);
        return total > 0 ? Math.round(((dist['calm'] ?? 0) / total) * 100) : null;
      })()
    : null;

  const cityData = stats ? buildCityData(stats.apiaries ?? [], t('community.other')) : [];
  const sizeData = stats ? buildSizeData(stats.apiaries ?? []) : [];

  return (
    <DashboardShell memberOnly>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('community.title')}</h1>
      </div>

      {loading && <div className="spinner" />}

      {!loading && !stats && (
        <p className="dash-empty">{t('community.noData')}</p>
      )}

      {!loading && stats && (
        <>
          {/* Snapshot pills */}
          <h2 className="dash-section-title">{t('community.snapshot')}</h2>
          <div className="dash-stat-row">
            <div className="dash-stat-pill">
              <span className="num">{stats.apiary_count.toLocaleString()}</span>
              <span className="lbl">{t('overview.apiaries')}</span>
            </div>
            <div className="dash-stat-pill">
              <span className="num">{stats.hive_count.toLocaleString()}</span>
              <span className="lbl">{t('overview.hives')}</span>
            </div>
            <div className="dash-stat-pill">
              <span className="num">{stats.inspection_count.toLocaleString()}</span>
              <span className="lbl">{t('overview.inspections')}</span>
            </div>
          </div>

          {/* Health averages */}
          <h2 className="dash-section-title" style={{ marginTop: 32 }}>{t('community.health')}</h2>
          <div className="dash-stat-row">
            <div className="dash-stat-pill">
              <span className="num">{stats.avg_varroa_count != null ? stats.avg_varroa_count.toFixed(1) : '—'}</span>
              <span className="lbl">{t('community.avgVarroa')}</span>
            </div>
            <div className="dash-stat-pill">
              <span className="num">{calmPct != null ? `${calmPct}%` : '—'}</span>
              <span className="lbl">{t('community.goodMood')}</span>
            </div>
            <div className="dash-stat-pill">
              <span className="num">{stats.avg_brood_frames != null ? stats.avg_brood_frames.toFixed(1) : '—'}</span>
              <span className="lbl">{t('community.avgBrood')}</span>
            </div>
            <div className="dash-stat-pill">
              <span className="num">{stats.avg_inspection_interval_days != null ? `${stats.avg_inspection_interval_days}d` : '—'}</span>
              <span className="lbl">{t('community.interval')}</span>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 32 }}>
            <div className="dash-chart-box">
              <h3 className="dash-section-title" style={{ marginTop: 0, marginBottom: 12 }}>{t('community.moodChart')}</h3>
              {Object.keys(stats.mood_distribution).length > 0
                ? <MoodChart distribution={stats.mood_distribution} />
                : <p className="dash-empty">{t('community.noData')}</p>}
            </div>

            <div className="dash-chart-box">
              <h3 className="dash-section-title" style={{ marginTop: 0, marginBottom: 12 }}>{t('community.cityChart')}</h3>
              {cityData.length > 0
                ? <CityChart data={cityData} />
                : <p className="dash-empty">{t('community.noData')}</p>}
            </div>

            <div className="dash-chart-box">
              <h3 className="dash-section-title" style={{ marginTop: 0, marginBottom: 12 }}>{t('community.sizeChart')}</h3>
              {(stats.apiaries ?? []).length > 0
                ? <SizeChart data={sizeData} />
                : <p className="dash-empty">{t('community.noData')}</p>}
            </div>
          </div>

          {/* Public apiaries table */}
          <h2 className="dash-section-title" style={{ marginTop: 32 }}>{t('community.apiaryTable')}</h2>
          {(stats.apiaries ?? []).length === 0 ? (
            <p className="dash-empty">{t('community.noData')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{t('community.city')}</th>
                    <th>{t('overview.hives')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(stats.apiaries ?? [])]
                    .sort((a, b) => b.hive_count - a.hive_count)
                    .map(a => (
                      <tr key={a.id}>
                        <td>{a.city_name || <em style={{ color: 'var(--muted)' }}>{t('community.other')}</em>}</td>
                        <td>{a.hive_count}</td>
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
