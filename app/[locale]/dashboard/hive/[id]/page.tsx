'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import DashboardShell from '@/components/DashboardShell';
import { getHive, getHiveStats, getInspections, updateHive, deleteHive, createInspection, updateInspection, deleteInspection, getUserFieldDefs, getApiaryFieldDefs, type Hive, type HiveStats, type Inspection, type InspectionInput, type FieldDefinition } from '@/lib/api';

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

  const [inspPage, setInspPage] = useState(1);
  const [inspTotal, setInspTotal] = useState(0);
  const [inspPages, setInspPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspectionFormMode, setInspectionFormMode] = useState<'create' | 'edit'>('create');
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);
  const [inspectionForm, setInspectionForm] = useState({ date: '', varroa_count: '', mood: '', queen_seen: '', brood_frames: '' });
  const [inspectionFieldDefs, setInspectionFieldDefs] = useState<FieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [savingInspection, setSavingInspection] = useState(false);
  const [inspectionMessage, setInspectionMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingInspectionId, setDeletingInspectionId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getHive(id), getHiveStats(id), getInspections(id, 1)])
      .then(([h, s, i]) => {
        setHive(h);
        setStats(s);
        setInspections(i.items);
        setInspTotal(i.total);
        setInspPages(i.pages);
        setEditForm({
          name: h.name,
          hive_type: h.hive_type,
          acquisition_date: h.acquisition_date ?? '',
          notes: h.notes ?? '',
        });
        return Promise.all([getUserFieldDefs(), getApiaryFieldDefs(h.apiary_id)]);
      })
      .then(([userDefs, apiaryDefs]) => {
        const merged = [...userDefs, ...apiaryDefs]
          .filter(fd => fd.target === 'inspection')
          .sort((a, b) => a.sort_order - b.sort_order);
        setInspectionFieldDefs(merged);
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

  function openCreateInspection() {
    setInspectionFormMode('create');
    setEditingInspectionId(null);
    setInspectionForm({ date: new Date().toISOString().split('T')[0], varroa_count: '', mood: '', queen_seen: '', brood_frames: '' });
    const defaults: Record<string, string> = {};
    for (const fd of inspectionFieldDefs) {
      defaults[fd.id] = fd.default_value != null ? String(fd.default_value) : '';
    }
    setCustomFieldValues(defaults);
    setInspectionMessage(null);
    setShowInspectionForm(true);
  }

  function openEditInspection(ins: Inspection) {
    setInspectionFormMode('edit');
    setEditingInspectionId(ins.id);
    setInspectionForm({
      date: ins.date,
      varroa_count: ins.varroa_count != null ? String(ins.varroa_count) : '',
      mood: ins.mood ?? '',
      queen_seen: ins.queen_seen == null ? '' : ins.queen_seen ? 'true' : 'false',
      brood_frames: ins.brood_frames != null ? String(ins.brood_frames) : '',
    });
    const existing: Record<string, string> = {};
    for (const fd of inspectionFieldDefs) {
      const val = ins.custom_fields?.[fd.id];
      existing[fd.id] = val != null ? String(val) : (fd.default_value != null ? String(fd.default_value) : '');
    }
    setCustomFieldValues(existing);
    setInspectionMessage(null);
    setShowInspectionForm(true);
  }

  async function handleSaveInspection(e: React.FormEvent) {
    e.preventDefault();
    setSavingInspection(true);
    setInspectionMessage(null);
    const custom_fields: Record<string, unknown> = {};
    for (const fd of inspectionFieldDefs) {
      const val = customFieldValues[fd.id] ?? '';
      if (val === '') continue;
      if (fd.type === 'number') {
        const n = parseFloat(val);
        if (!isNaN(n)) custom_fields[fd.id] = n;
      } else if (fd.type === 'boolean') {
        custom_fields[fd.id] = val === 'true';
      } else {
        custom_fields[fd.id] = val;
      }
    }
    const data: InspectionInput = {
      date: inspectionForm.date,
      varroa_count: inspectionForm.varroa_count !== '' ? parseInt(inspectionForm.varroa_count) : null,
      mood: inspectionForm.mood || null,
      queen_seen: inspectionForm.queen_seen === '' ? null : inspectionForm.queen_seen === 'true',
      brood_frames: inspectionForm.brood_frames !== '' ? parseInt(inspectionForm.brood_frames) : null,
      custom_fields: Object.keys(custom_fields).length > 0 ? custom_fields : undefined,
    };
    try {
      if (inspectionFormMode === 'create') {
        const created = await createInspection(id, data);
        setInspections(prev => [created, ...prev]);
        setShowInspectionForm(false);
        setInspectionMessage({ type: 'ok', text: t('hive.inspectionSaveSuccess') });
      } else if (editingInspectionId) {
        const updated = await updateInspection(editingInspectionId, data);
        setInspections(prev => prev.map(ins => ins.id === editingInspectionId ? updated : ins));
        setShowInspectionForm(false);
        setInspectionMessage({ type: 'ok', text: t('hive.inspectionUpdateSuccess') });
      }
    } catch (err) {
      setInspectionMessage({ type: 'err', text: err instanceof Error ? err.message : t('hive.errorGeneric') });
    } finally {
      setSavingInspection(false);
    }
  }

  async function handleDeleteInspection(insId: string) {
    setDeletingInspectionId(insId);
    try {
      await deleteInspection(insId);
      setInspections(prev => prev.filter(ins => ins.id !== insId));
      setDeleteConfirmId(null);
    } catch (err) {
      setInspectionMessage({ type: 'err', text: err instanceof Error ? err.message : t('hive.errorGeneric') });
    } finally {
      setDeletingInspectionId(null);
    }
  }

  async function loadMoreInspections() {
    setLoadingMore(true);
    try {
      const next = await getInspections(id, inspPage + 1);
      setInspections(prev => [...prev, ...next.items]);
      setInspPage(next.page);
      setInspTotal(next.total);
      setInspPages(next.pages);
    } catch {}
    setLoadingMore(false);
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

          {/* Stats row */}
          {stats && (
            <div className="dash-stat-row">
              <div className="dash-stat-pill">
                <span className="num">{stats.inspection_count}</span>
                <span className="lbl">{t('hive.inspections')}</span>
              </div>
            </div>
          )}

          {/* Varroa chart */}
          <h2 className="dash-section-title">{t('hive.varroaTrend')}</h2>
          <div className="dash-chart-box">
            {stats?.varroa_trend.length
              ? <VarroaChart data={stats.varroa_trend} />
              : <p className="dash-empty">{t('hive.noTrend')}</p>}
          </div>

          {/* Mood distribution */}
          {stats && (() => {
            const mood = moodPct(stats.mood_distribution);
            return (
              <div className="dash-mood-section">
                <h2 className="dash-section-title">{t('hive.moodTitle')}</h2>
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
                  <p className="dash-empty">{t('hive.noMoodData')}</p>
                )}
              </div>
            );
          })()}

          {/* Inspection table */}
          <div className="dash-page-header" style={{ marginTop: 24 }}>
            <h2 className="dash-section-title" style={{ margin: 0 }}>{t('hive.inspections')}</h2>
            {!showInspectionForm && (
              <button className="dash-new-btn" onClick={openCreateInspection}>{t('hive.newInspectionBtn')}</button>
            )}
          </div>

          {inspectionMessage && (
            <div className={inspectionMessage.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>
              {inspectionMessage.text}
            </div>
          )}

          {showInspectionForm && (
            <div className="dash-inline-form">
              <h2>{inspectionFormMode === 'create' ? t('hive.addInspectionTitle') : t('hive.editInspectionTitle')}</h2>
              <form onSubmit={handleSaveInspection}>
                <div className="dash-form-group">
                  <label>{t('hive.date')}</label>
                  <input type="date" value={inspectionForm.date} required
                    onChange={e => setInspectionForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="dash-form-group">
                  <label>{t('hive.varroa')}</label>
                  <input type="number" min="0" value={inspectionForm.varroa_count}
                    onChange={e => setInspectionForm(f => ({ ...f, varroa_count: e.target.value }))} />
                </div>
                <div className="dash-form-group">
                  <label>{t('hive.mood')}</label>
                  <select className="dash-profile-select" value={inspectionForm.mood}
                    onChange={e => setInspectionForm(f => ({ ...f, mood: e.target.value }))}>
                    <option value="">—</option>
                    <option value="calm">{t('hive.moodCalm')}</option>
                    <option value="nervous">{t('hive.moodNervous')}</option>
                    <option value="aggressive">{t('hive.moodAggressive')}</option>
                  </select>
                </div>
                <div className="dash-form-group">
                  <label>{t('hive.queen')}</label>
                  <select className="dash-profile-select" value={inspectionForm.queen_seen}
                    onChange={e => setInspectionForm(f => ({ ...f, queen_seen: e.target.value }))}>
                    <option value="">{t('hive.queenNotRecorded')}</option>
                    <option value="true">{t('hive.yes')}</option>
                    <option value="false">{t('hive.no')}</option>
                  </select>
                </div>
                <div className="dash-form-group">
                  <label>{t('hive.brood')}</label>
                  <input type="number" min="0" max="10" value={inspectionForm.brood_frames}
                    onChange={e => setInspectionForm(f => ({ ...f, brood_frames: e.target.value }))} />
                </div>
                {inspectionFieldDefs.length > 0 && (
                  <>
                    <h3 className="dash-section-title" style={{ margin: '16px 0 8px', fontSize: '.85rem' }}>{t('fieldDefs.title')}</h3>
                    {inspectionFieldDefs.map(fd => (
                      <div key={fd.id} className="dash-form-group">
                        <label>{fd.name}{fd.required && ' *'}</label>
                        {fd.type === 'text' && (
                          <input type="text" value={customFieldValues[fd.id] ?? ''} required={fd.required}
                            onChange={e => setCustomFieldValues(v => ({ ...v, [fd.id]: e.target.value }))} />
                        )}
                        {fd.type === 'number' && (
                          <input type="number" value={customFieldValues[fd.id] ?? ''} required={fd.required}
                            onChange={e => setCustomFieldValues(v => ({ ...v, [fd.id]: e.target.value }))} />
                        )}
                        {fd.type === 'date' && (
                          <input type="date" value={customFieldValues[fd.id] ?? ''} required={fd.required}
                            onChange={e => setCustomFieldValues(v => ({ ...v, [fd.id]: e.target.value }))} />
                        )}
                        {fd.type === 'boolean' && (
                          <select className="dash-profile-select" value={customFieldValues[fd.id] ?? ''} required={fd.required}
                            onChange={e => setCustomFieldValues(v => ({ ...v, [fd.id]: e.target.value }))}>
                            {!fd.required && <option value="">—</option>}
                            <option value="true">{t('hive.yes')}</option>
                            <option value="false">{t('hive.no')}</option>
                          </select>
                        )}
                        {fd.type === 'select' && (
                          <select className="dash-profile-select" value={customFieldValues[fd.id] ?? ''} required={fd.required}
                            onChange={e => setCustomFieldValues(v => ({ ...v, [fd.id]: e.target.value }))}>
                            {!fd.required && <option value="">—</option>}
                            {fd.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </>
                )}
                <div className="dash-form-actions">
                  <button className="dash-submit-btn" type="submit" disabled={savingInspection}>
                    {savingInspection ? '…' : inspectionFormMode === 'create' ? t('hive.inspectionSaveBtn') : t('hive.inspectionUpdateBtn')}
                  </button>
                  <button className="dash-cancel-btn" type="button" onClick={() => setShowInspectionForm(false)}>
                    {t('apiaries.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {inspections.length === 0 && !showInspectionForm
            ? <p className="dash-empty">{t('hive.noInspections')}</p>
            : inspections.length > 0 && (
              <>
              <p className="dash-inspection-count">
                {t('hive.inspectionShowing', { shown: inspections.length, total: inspTotal })}
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table className="dash-inspection-table">
                  <thead>
                    <tr>
                      <th>{t('hive.date')}</th>
                      <th>{t('hive.varroa')}</th>
                      <th>{t('hive.mood')}</th>
                      <th>{t('hive.queen')}</th>
                      <th>{t('hive.brood')}</th>
                      <th>{t('hive.actions')}</th>
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
                        <td>
                          {deleteConfirmId === ins.id ? (
                            <span className="dash-row-actions">
                              <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{t('hive.inspectionConfirmDeleteText')}</span>
                              <button className="dash-row-btn dash-row-btn-danger"
                                onClick={() => handleDeleteInspection(ins.id)}
                                disabled={deletingInspectionId === ins.id}>
                                {deletingInspectionId === ins.id ? '…' : t('hive.inspectionConfirmDeleteBtn')}
                              </button>
                              <button className="dash-row-btn" onClick={() => setDeleteConfirmId(null)}>
                                {t('apiaries.cancel')}
                              </button>
                            </span>
                          ) : (
                            <span className="dash-row-actions">
                              <button className="dash-row-btn" onClick={() => openEditInspection(ins)}>
                                {t('hive.inspectionEditBtn')}
                              </button>
                              <button className="dash-row-btn dash-row-btn-danger" onClick={() => setDeleteConfirmId(ins.id)}>
                                {t('hive.inspectionDeleteBtn')}
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inspPage < inspPages && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button className="dash-admin-btn" onClick={loadMoreInspections} disabled={loadingMore}>
                    {loadingMore ? t('hive.inspectionLoadingMore') : t('hive.inspectionLoadMore')}
                  </button>
                </div>
              )}
              </>
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
