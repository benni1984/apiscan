'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import DashboardShell from '@/components/DashboardShell';
import { adminGetUsers, adminSetSupporter, adminDeleteUser, adminRevokeTokens, type AdminUser, type Paginated } from '@/lib/api';

export default function AdminUsersPage() {
  const t = useTranslations('dash');
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [supporterFilter, setSupporterFilter] = useState<'all' | 'yes'>('all');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    adminGetUsers({
      q: query || undefined,
      supporter: supporterFilter === 'yes' ? true : undefined,
      page,
      per_page: 20,
    })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, supporterFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleSupporter(user: AdminUser) {
    await adminSetSupporter(user.id, !user.is_supporter);
    load();
  }

  async function revokeTokens(user: AdminUser) {
    if (!window.confirm(t('admin.users.confirmRevoke'))) return;
    await adminRevokeTokens(user.id);
  }

  async function deleteUser(user: AdminUser) {
    if (!window.confirm(t('admin.users.confirmDelete'))) return;
    await adminDeleteUser(user.id);
    load();
  }

  return (
    <DashboardShell adminOnly>
      <h1 className="dash-page-title">{t('admin.users.title')}</h1>

      <div className="dash-admin-toolbar">
        <input
          className="dash-admin-search"
          placeholder={t('admin.users.search')}
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
        />
        <select
          className="dash-admin-select"
          value={supporterFilter}
          onChange={e => { setSupporterFilter(e.target.value as 'all' | 'yes'); setPage(1); }}
        >
          <option value="all">{t('admin.users.all')}</option>
          <option value="yes">{t('admin.users.supportersOnly')}</option>
        </select>
      </div>

      {loading && <div className="spinner" />}

      {!loading && data && (
        <>
          <div className="dash-admin-table-wrap">
            <table className="dash-admin-table">
              <thead>
                <tr>
                  <th>{t('admin.users.email')}</th>
                  <th>{t('admin.users.name')}</th>
                  <th>{t('admin.users.joined')}</th>
                  <th>{t('admin.users.supporter')}</th>
                  <th>{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(u => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.name}</td>
                    <td>{u.created_at.slice(0, 10)}</td>
                    <td>
                      <span className={`dash-badge ${u.is_supporter ? 'dash-badge-public' : 'dash-badge-private'}`}>
                        {u.is_supporter ? '✓' : '–'}
                      </span>
                    </td>
                    <td className="dash-admin-actions">
                      <button className="dash-admin-btn" onClick={() => toggleSupporter(u)}>
                        {u.is_supporter ? t('admin.users.removeSupporter') : t('admin.users.makeSupporter')}
                      </button>
                      <button className="dash-admin-btn" onClick={() => revokeTokens(u)}>
                        {t('admin.users.revokeSessions')}
                      </button>
                      <button className="dash-admin-btn dash-admin-btn-danger" onClick={() => deleteUser(u)}>
                        {t('admin.users.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-admin-pagination">
            <button className="dash-admin-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span>{page} / {data.pages}</span>
            <button className="dash-admin-btn" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
