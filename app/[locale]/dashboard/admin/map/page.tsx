'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import DashboardShell from '@/components/DashboardShell';
import { adminGetApiaries, adminGetFlaggedApiaries, adminSetPrivate, type AdminApiary, type Paginated } from '@/lib/api';

type Tab = 'all' | 'flagged';

export default function AdminMapPage() {
  const t = useTranslations('dash');
  const [tab, setTab] = useState<Tab>('all');
  const [data, setData] = useState<Paginated<AdminApiary> | null>(null);
  const [flagged, setFlagged] = useState<AdminApiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    if (tab === 'all') {
      adminGetApiaries({ page, per_page: 20 })
        .then(setData)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      adminGetFlaggedApiaries()
        .then(setFlagged)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [tab, page]);

  async function setPrivate(apiary: AdminApiary) {
    await adminSetPrivate(apiary.id);
    if (tab === 'all') {
      adminGetApiaries({ page, per_page: 20 }).then(setData).catch(() => {});
    } else {
      adminGetFlaggedApiaries().then(setFlagged).catch(() => {});
    }
  }

  const rows: AdminApiary[] = tab === 'all' ? (data?.items ?? []) : flagged;

  return (
    <DashboardShell adminOnly>
      <h1 className="dash-page-title">{t('admin.map.title')}</h1>

      <div className="dash-admin-tabs">
        <button
          className={`dash-admin-tab${tab === 'all' ? ' active' : ''}`}
          onClick={() => { setTab('all'); setPage(1); }}
        >
          {t('admin.map.all')}
        </button>
        <button
          className={`dash-admin-tab${tab === 'flagged' ? ' active' : ''}`}
          onClick={() => setTab('flagged')}
        >
          {t('admin.map.flagged')}
        </button>
      </div>

      {loading && <div className="spinner" />}

      {!loading && tab === 'flagged' && flagged.length === 0 && (
        <p className="dash-empty">{t('admin.map.noFlagged')}</p>
      )}

      {!loading && tab === 'all' && rows.length === 0 && (
        <p className="dash-empty">{t('admin.map.noPublic')}</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="dash-admin-table-wrap">
          <table className="dash-admin-table">
            <thead>
              <tr>
                <th>{t('admin.map.name')}</th>
                <th>{t('admin.map.owner')}</th>
                <th>{t('admin.map.hives')}</th>
                <th>Lat / Lon</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.owner_email}</td>
                  <td>{a.hive_count}</td>
                  <td>
                    {a.latitude != null && a.longitude != null
                      ? `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}`
                      : '–'}
                  </td>
                  <td>
                    <button className="dash-admin-btn dash-admin-btn-danger" onClick={() => setPrivate(a)}>
                      {t('admin.map.setPrivate')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'all' && data && (
        <div className="dash-admin-pagination">
          <button className="dash-admin-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
          <span>{page} / {data.pages}</span>
          <button className="dash-admin-btn" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}
    </DashboardShell>
  );
}
