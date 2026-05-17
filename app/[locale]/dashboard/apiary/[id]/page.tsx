'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import {
  getApiary, getHives, getApiaryStats, updateApiary, deleteApiary, createHive,
  getApiaryFieldDefs, createApiaryFieldDef, updateApiaryFieldDef, deleteApiaryFieldDef,
  type Apiary, type Hive, type ApiaryStats, type FieldDefinition, type FieldType, type FieldTarget,
} from '@/lib/api';

function moodPct(dist: { calm: number; nervous: number; aggressive: number }) {
  const total = dist.calm + dist.nervous + dist.aggressive;
  if (total === 0) return null;
  return {
    calm: dist.calm, nervous: dist.nervous, aggressive: dist.aggressive,
    calmPct: Math.round((dist.calm / total) * 100),
    nervousPct: Math.round((dist.nervous / total) * 100),
    aggressivePct: Math.round((dist.aggressive / total) * 100),
  };
}

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

  const [apiaryFields, setApiaryFields] = useState<FieldDefinition[]>([]);
  const [showCreateField, setShowCreateField] = useState(false);
  const [creatingField, setCreatingField] = useState(false);
  const [createFieldForm, setCreateFieldForm] = useState({ name: '', target: 'inspection' as FieldTarget, type: 'text' as FieldType, options: '', required: false });
  const [createFieldMsg, setCreateFieldMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);
  const [editFieldForm, setEditFieldForm] = useState({ name: '', options: '', required: false });
  const [editFieldMsg, setEditFieldMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [deleteFieldConfirmId, setDeleteFieldConfirmId] = useState<string | null>(null);
  const [deletingField, setDeletingField] = useState(false);

  useEffect(() => {
    Promise.all([getApiary(id), getHives(id), getApiaryStats(id), getApiaryFieldDefs(id)])
      .then(([a, h, s, fds]) => {
        setApiary(a);
        setHives(h.items);
        setStats(s);
        setApiaryFields(fds);
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

  const fieldTargetLabel: Record<FieldTarget, string> = { hive: t('fieldDefs.targetHive'), inspection: t('fieldDefs.targetInspection') };
  const fieldTypeLabel: Record<FieldType, string> = { text: t('fieldDefs.typeText'), number: t('fieldDefs.typeNumber'), boolean: t('fieldDefs.typeBoolean'), date: t('fieldDefs.typeDate'), select: t('fieldDefs.typeSelect') };

  async function handleCreateField(e: React.FormEvent) {
    e.preventDefault();
    setCreatingField(true);
    setCreateFieldMsg(null);
    try {
      const options = createFieldForm.type === 'select'
        ? createFieldForm.options.split('\n').map(s => s.trim()).filter(Boolean)
        : undefined;
      const fd = await createApiaryFieldDef(id, {
        name: createFieldForm.name, target: createFieldForm.target, type: createFieldForm.type,
        ...(options ? { options } : {}), required: createFieldForm.required,
      });
      setApiaryFields(prev => [...prev, fd]);
      setShowCreateField(false);
      setCreateFieldForm({ name: '', target: 'inspection', type: 'text', options: '', required: false });
      setCreateFieldMsg({ type: 'ok', text: t('fieldDefs.createSuccess') });
    } catch (err) {
      setCreateFieldMsg({ type: 'err', text: err instanceof Error ? err.message : t('fieldDefs.errorGeneric') });
    } finally {
      setCreatingField(false);
    }
  }

  async function handleSaveField(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFieldId) return;
    setSavingField(true);
    setEditFieldMsg(null);
    const fd = apiaryFields.find(f => f.id === editingFieldId);
    try {
      const options = fd?.type === 'select'
        ? editFieldForm.options.split('\n').map(s => s.trim()).filter(Boolean)
        : undefined;
      const updated = await updateApiaryFieldDef(id, editingFieldId, {
        name: editFieldForm.name, ...(options !== undefined ? { options } : {}), required: editFieldForm.required,
      });
      setApiaryFields(prev => prev.map(f => f.id === editingFieldId ? updated : f));
      setEditingFieldId(null);
      setEditFieldMsg({ type: 'ok', text: t('fieldDefs.saveSuccess') });
    } catch (err) {
      setEditFieldMsg({ type: 'err', text: err instanceof Error ? err.message : t('fieldDefs.errorGeneric') });
    } finally {
      setSavingField(false);
    }
  }

  async function handleDeleteField(fid: string) {
    setDeletingField(true);
    try {
      await deleteApiaryFieldDef(id, fid);
      setApiaryFields(prev => prev.filter(f => f.id !== fid));
      setDeleteFieldConfirmId(null);
    } catch {
      setDeleteFieldConfirmId(null);
    } finally {
      setDeletingField(false);
    }
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

          {/* ── Mood distribution ───────────────────────────────── */}
          {stats && (() => {
            const mood = moodPct(stats.mood_distribution);
            return (
              <div className="dash-mood-section">
                <h2 className="dash-section-title">{t('apiary.moodTitle')}</h2>
                {mood ? (
                  <>
                    <div className="dash-mood-bar">
                      {mood.calmPct > 0 && <div className="dash-mood-calm" style={{ width: `${mood.calmPct}%` }} />}
                      {mood.nervousPct > 0 && <div className="dash-mood-nervous" style={{ width: `${mood.nervousPct}%` }} />}
                      {mood.aggressivePct > 0 && <div className="dash-mood-aggressive" style={{ width: `${mood.aggressivePct}%` }} />}
                    </div>
                    <div className="dash-mood-legend">
                      <span><span className="dash-mood-dot dash-mood-calm" />{t('hive.moodCalm')} {mood.calmPct}% ({mood.calm})</span>
                      <span><span className="dash-mood-dot dash-mood-nervous" />{t('hive.moodNervous')} {mood.nervousPct}% ({mood.nervous})</span>
                      <span><span className="dash-mood-dot dash-mood-aggressive" />{t('hive.moodAggressive')} {mood.aggressivePct}% ({mood.aggressive})</span>
                    </div>
                  </>
                ) : (
                  <p className="dash-empty">{t('apiary.noMoodData')}</p>
                )}
              </div>
            );
          })()}

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

          {/* ── Apiary-scoped custom fields ──────────────────────────── */}
          <div style={{ marginTop: 32 }}>
            <div className="dash-page-header">
              <h2 className="dash-section-title" style={{ margin: 0 }}>{t('fieldDefs.apiaryTitle')}</h2>
              {!showCreateField && (
                <button className="dash-new-btn" onClick={() => { setShowCreateField(true); setCreateFieldMsg(null); }}>
                  {t('fieldDefs.new')}
                </button>
              )}
            </div>
            <p style={{ fontSize: '.85rem', color: 'var(--muted)', margin: '4px 0 16px' }}>{t('fieldDefs.apiarySubtitle')}</p>

            {createFieldMsg && (
              <div className={createFieldMsg.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>
                {createFieldMsg.text}
              </div>
            )}

            {showCreateField && (
              <div className="dash-inline-form">
                <h2>{t('fieldDefs.createTitle')}</h2>
                <form onSubmit={handleCreateField}>
                  <div className="dash-form-group">
                    <label>{t('fieldDefs.name')}</label>
                    <input type="text" value={createFieldForm.name} onChange={e => setCreateFieldForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                  </div>
                  <div className="dash-form-row">
                    <div className="dash-form-group">
                      <label>{t('fieldDefs.target')}</label>
                      <select className="dash-profile-select" value={createFieldForm.target} onChange={e => setCreateFieldForm(f => ({ ...f, target: e.target.value as FieldTarget }))}>
                        <option value="inspection">{t('fieldDefs.targetInspection')}</option>
                        <option value="hive">{t('fieldDefs.targetHive')}</option>
                      </select>
                    </div>
                    <div className="dash-form-group">
                      <label>{t('fieldDefs.type')}</label>
                      <select className="dash-profile-select" value={createFieldForm.type} onChange={e => setCreateFieldForm(f => ({ ...f, type: e.target.value as FieldType }))}>
                        <option value="text">{t('fieldDefs.typeText')}</option>
                        <option value="number">{t('fieldDefs.typeNumber')}</option>
                        <option value="boolean">{t('fieldDefs.typeBoolean')}</option>
                        <option value="date">{t('fieldDefs.typeDate')}</option>
                        <option value="select">{t('fieldDefs.typeSelect')}</option>
                      </select>
                    </div>
                  </div>
                  {createFieldForm.type === 'select' && (
                    <div className="dash-form-group">
                      <label>{t('fieldDefs.options')}</label>
                      <textarea value={createFieldForm.options} onChange={e => setCreateFieldForm(f => ({ ...f, options: e.target.value }))} placeholder={'Option 1\nOption 2'} />
                    </div>
                  )}
                  <label className="dash-inline-checkbox">
                    <input type="checkbox" checked={createFieldForm.required} onChange={e => setCreateFieldForm(f => ({ ...f, required: e.target.checked }))} />
                    {t('fieldDefs.required')}
                  </label>
                  <div className="dash-form-actions">
                    <button className="dash-submit-btn" type="submit" disabled={creatingField}>{creatingField ? '…' : t('fieldDefs.createBtn')}</button>
                    <button className="dash-cancel-btn" type="button" onClick={() => setShowCreateField(false)}>{t('fieldDefs.cancel')}</button>
                  </div>
                </form>
              </div>
            )}

            {apiaryFields.length === 0 && !showCreateField && (
              <p className="dash-empty">{t('fieldDefs.empty')}</p>
            )}
            {apiaryFields.length > 0 && (
              <>
                {editFieldMsg && (
                  <div className={editFieldMsg.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>{editFieldMsg.text}</div>
                )}
                <div className="dash-profile-card">
                  <table className="dash-inspection-table">
                    <thead>
                      <tr>
                        <th>{t('fieldDefs.colName')}</th>
                        <th>{t('fieldDefs.colTarget')}</th>
                        <th>{t('fieldDefs.colType')}</th>
                        <th>{t('fieldDefs.colRequired')}</th>
                        <th>{t('fieldDefs.colActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiaryFields.map(fd =>
                        deleteFieldConfirmId === fd.id ? (
                          <tr key={fd.id} className="dash-confirm-row">
                            <td colSpan={5}>
                              <div className="dash-confirm-inline">
                                <span className="dash-confirm-text">{t('fieldDefs.deleteConfirmText')}</span>
                                <span className="dash-confirm-actions">
                                  <button className="dash-row-btn dash-row-btn-danger" onClick={() => handleDeleteField(fd.id)} disabled={deletingField}>{deletingField ? '…' : t('fieldDefs.deleteConfirmBtn')}</button>
                                  <button className="dash-row-btn" onClick={() => setDeleteFieldConfirmId(null)} disabled={deletingField}>{t('fieldDefs.cancel')}</button>
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : editingFieldId === fd.id ? (
                          <tr key={fd.id} className="dash-edit-row">
                            <td colSpan={5}>
                              <form onSubmit={handleSaveField} className="dash-row-edit-form">
                                <div className="dash-form-group">
                                  <label>{t('fieldDefs.name')}</label>
                                  <input type="text" value={editFieldForm.name} onChange={e => setEditFieldForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                                </div>
                                {fd.type === 'select' && (
                                  <div className="dash-form-group">
                                    <label>{t('fieldDefs.options')}</label>
                                    <textarea value={editFieldForm.options} onChange={e => setEditFieldForm(f => ({ ...f, options: e.target.value }))} style={{ minHeight: 56 }} />
                                  </div>
                                )}
                                <label className="dash-inline-checkbox">
                                  <input type="checkbox" checked={editFieldForm.required} onChange={e => setEditFieldForm(f => ({ ...f, required: e.target.checked }))} />
                                  {t('fieldDefs.required')}
                                </label>
                                <div className="dash-form-actions">
                                  <button className="dash-submit-btn" type="submit" disabled={savingField}>{savingField ? '…' : t('fieldDefs.saveBtn')}</button>
                                  <button className="dash-cancel-btn" type="button" onClick={() => setEditingFieldId(null)}>{t('fieldDefs.cancel')}</button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        ) : (
                          <tr key={fd.id}>
                            <td>{fd.name}</td>
                            <td><span className={`dash-type-badge dash-target-${fd.target}`}>{fieldTargetLabel[fd.target]}</span></td>
                            <td><span className={`dash-type-badge dash-ftype-${fd.type}`}>{fieldTypeLabel[fd.type]}</span></td>
                            <td>{fd.required ? '✓' : '–'}</td>
                            <td>
                              <span className="dash-row-actions">
                                <button className="dash-row-btn" onClick={() => { setEditingFieldId(fd.id); setEditFieldForm({ name: fd.name, options: fd.options.join('\n'), required: fd.required }); setEditFieldMsg(null); }}>{t('hive.inspectionEditBtn')}</button>
                                <button className="dash-row-btn dash-row-btn-danger" onClick={() => setDeleteFieldConfirmId(fd.id)}>{t('fieldDefs.deleteBtn')}</button>
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
