'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import DashboardShell from '@/components/DashboardShell';
import { getHive, getHiveStats, getInspections, updateHive, deleteHive, type Hive, type HiveStats, type Inspection } from '@/lib/api';

const VarroaChart = dynamic(() => import('@/components/VarroaChart'), { ssr: false });

const HIVE_TYPES = ['langstroth', 'dadant', 'top_bar', 'warre', 'other'] as const;

export default function HivePage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('dash');
  const router = useRouter();

  const [hive, setHive] = useState<Hive | null>(null);
  const [stats, setStats] = useState<HiveStats | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', hive_type: 'langstroth', acquisition_date: '', notes: '' });
  const [editMessage, setEditMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [deleteStage, setDeleteStage] = useState<'idle' | 'confirm'>('idle');
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getHive(id), getHiveStats(id), getInspections(id)])
      .then(([h, s, i]) => {
        setHive(h);
        setStats(s);
        setInspections(i.items);
        setEditForm({
          name: h.name,
          hive_type: h.hive_type,
          acquisition_date: h.acquisition_date ?? '',
          notes: h.notes ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  function openEdit() {
    if (hive) {
      setEditForm({ name: hive.name, hive_type: hive.hive_type, acquisition_date: hive.acquisition_date ?? '', notes: hive.notes ?? '' });
    }
    setEditMessage(null);
    setShowEdit(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setEditMessage(null);
    try {
      const updated = await updateHive(id, {
        name: editForm.name,
        hive_type: editForm.hive_type,
        acquisition_date: editForm.acquisition_date || undefined,
        notes: editForm.notes || undefined,
      });
      setHive(updated);
      setShowEdit(false);
      setEditMessage({ type: 'ok', text: t('hive.saveSuccess') });
    } catch (err) {
      setEditMessage({ type: 'err', text: err instanceof Error ? err.message : t('hive.errorGeneric') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteMessage(null);
    try {
      await deleteHive(id);
      router.replace(hive ? `/dashboard/apiary/${hive.apiary_id}` : '/dashboard');
    } catch (err) {
      setDeleteMessage(err instanceof Error ? err.message : t('hive.errorGeneric'));
      setDeleteStage('idle');
      setDeleting(false);
    }
  }

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

          {/* ── Edit hive ────────────────────────────────────────────── */}
          {editMessage && (
            <div className={`${editMessage.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}`} style={{ marginTop: 24 }}>
              {editMessage.text}
            </div>
          )}
          {!showEdit ? (
            <div style={{ marginTop: 24 }}>
              <button className="dash-admin-btn" onClick={openEdit}>{t('hive.editBtn')}</button>
            </div>
          ) : (
            <div className="dash-inline-form" style={{ marginTop: 24 }}>
              <h2>{t('hive.editTitle')}</h2>
              <form onSubmit={handleSave}>
                <div className="dash-form-group">
                  <label>{t('apiaries.name')}</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>
                <div className="dash-form-group">
                  <label>{t('hive.hiveType')}</label>
                  <select
                    className="dash-profile-select"
                    value={editForm.hive_type}
                    onChange={e => setEditForm(f => ({ ...f, hive_type: e.target.value }))}
                  >
                    {HIVE_TYPES.map(ht => (
                      <option key={ht} value={ht}>{ht}</option>
                    ))}
                  </select>
                </div>
                <div className="dash-form-group">
                  <label>{t('hive.acquisitionDate')}</label>
                  <input
                    type="date"
                    value={editForm.acquisition_date}
                    onChange={e => setEditForm(f => ({ ...f, acquisition_date: e.target.value }))}
                  />
                </div>
                <div className="dash-form-group">
                  <label>{t('hive.notes')}</label>
                  <textarea
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="dash-form-actions">
                  <button className="dash-submit-btn" type="submit" disabled={saving}>
                    {saving ? '…' : t('hive.saveBtn')}
                  </button>
                  <button className="dash-cancel-btn" type="button" onClick={() => setShowEdit(false)}>
                    {t('apiaries.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Delete hive ──────────────────────────────────────────── */}
          <div className="dash-danger-zone">
            <h3>{t('hive.dangerTitle')}</h3>
            {deleteMessage && <div className="dash-error-banner">{deleteMessage}</div>}
            {deleteStage === 'idle' ? (
              <button
                className="dash-admin-btn dash-admin-btn-danger"
                onClick={() => setDeleteStage('confirm')}
              >
                {t('hive.deleteBtn')}
              </button>
            ) : (
              <>
                <p>{t('hive.deleteConfirmText')}</p>
                <div className="dash-danger-actions">
                  <button
                    className="dash-admin-btn dash-admin-btn-danger"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? '…' : t('hive.deleteConfirmBtn')}
                  </button>
                  <button
                    className="dash-admin-btn"
                    onClick={() => setDeleteStage('idle')}
                    disabled={deleting}
                  >
                    {t('apiaries.cancel')}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
