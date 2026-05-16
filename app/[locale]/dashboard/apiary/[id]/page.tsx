'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { getApiary, getHives, getApiaryStats, updateApiary, deleteApiary, createHive, type Apiary, type Hive, type ApiaryStats } from '@/lib/api';

const HIVE_TYPES = ['langstroth', 'dadant', 'top_bar', 'warre', 'other'] as const;

export default function ApiaryPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('dash');
  const router = useRouter();

  const [apiary, setApiary] = useState<Apiary | null>(null);
  const [hives, setHives] = useState<Hive[]>([]);
  const [stats, setStats] = useState<ApiaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', address: '', isPublic: false });
  const [editMessage, setEditMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [deleteStage, setDeleteStage] = useState<'idle' | 'confirm'>('idle');
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [showCreateHive, setShowCreateHive] = useState(false);
  const [creatingHive, setCreatingHive] = useState(false);
  const [hiveForm, setHiveForm] = useState({ name: '', hive_type: 'langstroth' });
  const [hiveMessage, setHiveMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([getApiary(id), getHives(id), getApiaryStats(id)])
      .then(([a, h, s]) => {
        setApiary(a);
        setHives(h.items);
        setStats(s);
        setEditForm({ name: a.name, description: a.description ?? '', address: a.address ?? '', isPublic: a.is_public });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  function openEdit() {
    if (apiary) {
      setEditForm({ name: apiary.name, description: apiary.description ?? '', address: apiary.address ?? '', isPublic: apiary.is_public });
    }
    setEditMessage(null);
    setShowEdit(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setEditMessage(null);
    try {
      const updated = await updateApiary(id, {
        name: editForm.name,
        description: editForm.description || undefined,
        address: editForm.address || undefined,
        is_public: editForm.isPublic,
      });
      setApiary(updated);
      setShowEdit(false);
      setEditMessage({ type: 'ok', text: t('apiary.saveSuccess') });
    } catch (err) {
      setEditMessage({ type: 'err', text: err instanceof Error ? err.message : t('apiary.errorGeneric') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteMessage(null);
    try {
      await deleteApiary(id);
      router.replace('/dashboard');
    } catch (err) {
      const msg = err instanceof Error && err.message === 'has_hives'
        ? t('apiary.deleteHasHives')
        : t('apiary.errorGeneric');
      setDeleteMessage({ type: 'err', text: msg });
      setDeleteStage('idle');
      setDeleting(false);
    }
  }

  function openCreateHive() {
    setHiveForm({ name: '', hive_type: 'langstroth' });
    setHiveMessage(null);
    setShowCreateHive(true);
  }

  async function handleCreateHive(e: React.FormEvent) {
    e.preventDefault();
    setCreatingHive(true);
    setHiveMessage(null);
    try {
      const hive = await createHive(id, { name: hiveForm.name, hive_type: hiveForm.hive_type });
      setHives(prev => [...prev, hive]);
      setShowCreateHive(false);
      setHiveMessage({ type: 'ok', text: t('apiary.createHiveSuccess') });
    } catch (err) {
      setHiveMessage({ type: 'err', text: err instanceof Error ? err.message : t('apiary.errorGeneric') });
    } finally {
      setCreatingHive(false);
    }
  }

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

          {/* ── Hive list + create ───────────────────────────────── */}
          <div className="dash-page-header" style={{ marginTop: 8 }}>
            <h2 className="dash-section-title" style={{ margin: 0 }}>{t('apiary.hives')}</h2>
            {!showCreateHive && (
              <button className="dash-new-btn" onClick={openCreateHive}>{t('apiary.newHive')}</button>
            )}
          </div>

          {hiveMessage && (
            <div className={hiveMessage.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>
              {hiveMessage.text}
            </div>
          )}

          {showCreateHive && (
            <div className="dash-inline-form">
              <h2>{t('apiary.createHiveTitle')}</h2>
              <form onSubmit={handleCreateHive}>
                <div className="dash-form-group">
                  <label>{t('hive.hiveType')}</label>
                  <select
                    className="dash-profile-select"
                    value={hiveForm.hive_type}
                    onChange={e => setHiveForm(f => ({ ...f, hive_type: e.target.value }))}
                  >
                    {HIVE_TYPES.map(ht => (
                      <option key={ht} value={ht}>{ht}</option>
                    ))}
                  </select>
                </div>
                <div className="dash-form-group">
                  <label>{t('apiaries.name')}</label>
                  <input
                    type="text"
                    value={hiveForm.name}
                    onChange={e => setHiveForm(f => ({ ...f, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>
                <div className="dash-form-actions">
                  <button className="dash-submit-btn" type="submit" disabled={creatingHive}>
                    {creatingHive ? '…' : t('apiary.createHiveBtn')}
                  </button>
                  <button className="dash-cancel-btn" type="button" onClick={() => setShowCreateHive(false)}>
                    {t('apiaries.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {hives.length === 0 && !showCreateHive
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

          {/* ── Edit apiary ─────────────────────────────────────────── */}
          {editMessage && (
            <div className={`${editMessage.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}`} style={{ marginTop: 24 }}>
              {editMessage.text}
            </div>
          )}
          {!showEdit ? (
            <div style={{ marginTop: 24 }}>
              <button className="dash-admin-btn" onClick={openEdit}>{t('apiary.editBtn')}</button>
            </div>
          ) : (
            <div className="dash-inline-form" style={{ marginTop: 24 }}>
              <h2>{t('apiary.editTitle')}</h2>
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
                  <label>{t('apiaries.description')}</label>
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="dash-form-group">
                  <label>{t('apiaries.address')}</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                  />
                </div>
                <label className="dash-inline-checkbox">
                  <input
                    type="checkbox"
                    checked={editForm.isPublic}
                    onChange={e => setEditForm(f => ({ ...f, isPublic: e.target.checked }))}
                  />
                  {t('apiaries.isPublic')}
                </label>
                <div className="dash-form-actions">
                  <button className="dash-submit-btn" type="submit" disabled={saving}>
                    {saving ? '…' : t('apiary.saveBtn')}
                  </button>
                  <button className="dash-cancel-btn" type="button" onClick={() => setShowEdit(false)}>
                    {t('apiaries.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Delete apiary ────────────────────────────────────────── */}
          <div className="dash-danger-zone">
            <h3>{t('apiary.dangerTitle')}</h3>
            {deleteMessage && (
              <div className="dash-error-banner">{deleteMessage.text}</div>
            )}
            {deleteStage === 'idle' ? (
              <button
                className="dash-admin-btn dash-admin-btn-danger"
                onClick={() => setDeleteStage('confirm')}
              >
                {t('apiary.deleteBtn')}
              </button>
            ) : (
              <>
                <p>{t('apiary.deleteConfirmText')}</p>
                <div className="dash-danger-actions">
                  <button
                    className="dash-admin-btn dash-admin-btn-danger"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? '…' : t('apiary.deleteConfirmBtn')}
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
