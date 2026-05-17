'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import DashboardShell from '@/components/DashboardShell';
import {
  getUserFieldDefs, createUserFieldDef, updateUserFieldDef, deleteUserFieldDef,
  type FieldDefinition, type FieldType, type FieldTarget,
} from '@/lib/api';

type CreateForm = { name: string; target: FieldTarget; type: FieldType; options: string; required: boolean };
type EditForm = { name: string; options: string; required: boolean };

export default function FieldDefinitionsPage() {
  const t = useTranslations('dash');
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ name: '', target: 'inspection', type: 'text', options: '', required: false });
  const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', options: '', required: false });
  const [editMsg, setEditMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const targetLabel: Record<FieldTarget, string> = {
    hive: t('fieldDefs.targetHive'),
    inspection: t('fieldDefs.targetInspection'),
  };
  const typeLabel: Record<FieldType, string> = {
    text: t('fieldDefs.typeText'),
    number: t('fieldDefs.typeNumber'),
    boolean: t('fieldDefs.typeBoolean'),
    date: t('fieldDefs.typeDate'),
    select: t('fieldDefs.typeSelect'),
  };

  useEffect(() => {
    getUserFieldDefs()
      .then(setFields)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      const options = createForm.type === 'select'
        ? createForm.options.split('\n').map(s => s.trim()).filter(Boolean)
        : undefined;
      const fd = await createUserFieldDef({
        name: createForm.name,
        target: createForm.target,
        type: createForm.type,
        ...(options ? { options } : {}),
        required: createForm.required,
      });
      setFields(prev => [...prev, fd]);
      setShowCreate(false);
      setCreateForm({ name: '', target: 'inspection', type: 'text', options: '', required: false });
      setCreateMsg({ type: 'ok', text: t('fieldDefs.createSuccess') });
    } catch (err) {
      setCreateMsg({ type: 'err', text: err instanceof Error ? err.message : t('fieldDefs.errorGeneric') });
    } finally {
      setCreating(false);
    }
  }

  function openEdit(fd: FieldDefinition) {
    setEditingId(fd.id);
    setEditForm({ name: fd.name, options: fd.options.join('\n'), required: fd.required });
    setEditMsg(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setEditMsg(null);
    const fd = fields.find(f => f.id === editingId);
    try {
      const options = fd?.type === 'select'
        ? editForm.options.split('\n').map(s => s.trim()).filter(Boolean)
        : undefined;
      const updated = await updateUserFieldDef(editingId, {
        name: editForm.name,
        ...(options !== undefined ? { options } : {}),
        required: editForm.required,
      });
      setFields(prev => prev.map(f => f.id === editingId ? updated : f));
      setEditingId(null);
      setEditMsg({ type: 'ok', text: t('fieldDefs.saveSuccess') });
    } catch (err) {
      setEditMsg({ type: 'err', text: err instanceof Error ? err.message : t('fieldDefs.errorGeneric') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteUserFieldDef(id);
      setFields(prev => prev.filter(f => f.id !== id));
      setDeleteConfirmId(null);
    } catch {
      setDeleteConfirmId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardShell>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('fieldDefs.title')}</h1>
        {!showCreate && (
          <button className="dash-new-btn" onClick={() => { setShowCreate(true); setCreateMsg(null); }}>
            {t('fieldDefs.new')}
          </button>
        )}
      </div>

      {createMsg && (
        <div className={createMsg.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>
          {createMsg.text}
        </div>
      )}

      {showCreate && (
        <div className="dash-inline-form">
          <h2>{t('fieldDefs.createTitle')}</h2>
          <form onSubmit={handleCreate}>
            <div className="dash-form-group">
              <label>{t('fieldDefs.name')}</label>
              <input
                type="text"
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="dash-form-row">
              <div className="dash-form-group">
                <label>{t('fieldDefs.target')}</label>
                <select
                  className="dash-profile-select"
                  value={createForm.target}
                  onChange={e => setCreateForm(f => ({ ...f, target: e.target.value as FieldTarget }))}
                >
                  <option value="inspection">{t('fieldDefs.targetInspection')}</option>
                  <option value="hive">{t('fieldDefs.targetHive')}</option>
                </select>
              </div>
              <div className="dash-form-group">
                <label>{t('fieldDefs.type')}</label>
                <select
                  className="dash-profile-select"
                  value={createForm.type}
                  onChange={e => setCreateForm(f => ({ ...f, type: e.target.value as FieldType }))}
                >
                  <option value="text">{t('fieldDefs.typeText')}</option>
                  <option value="number">{t('fieldDefs.typeNumber')}</option>
                  <option value="boolean">{t('fieldDefs.typeBoolean')}</option>
                  <option value="date">{t('fieldDefs.typeDate')}</option>
                  <option value="select">{t('fieldDefs.typeSelect')}</option>
                </select>
              </div>
            </div>
            {createForm.type === 'select' && (
              <div className="dash-form-group">
                <label>{t('fieldDefs.options')}</label>
                <textarea
                  value={createForm.options}
                  onChange={e => setCreateForm(f => ({ ...f, options: e.target.value }))}
                  placeholder={'Option 1\nOption 2\nOption 3'}
                />
              </div>
            )}
            <label className="dash-inline-checkbox">
              <input
                type="checkbox"
                checked={createForm.required}
                onChange={e => setCreateForm(f => ({ ...f, required: e.target.checked }))}
              />
              {t('fieldDefs.required')}
            </label>
            <div className="dash-form-actions">
              <button className="dash-submit-btn" type="submit" disabled={creating}>
                {creating ? '…' : t('fieldDefs.createBtn')}
              </button>
              <button className="dash-cancel-btn" type="button" onClick={() => setShowCreate(false)}>
                {t('fieldDefs.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="spinner" />}
      {!loading && fields.length === 0 && !showCreate && (
        <p className="dash-empty">{t('fieldDefs.empty')}</p>
      )}
      {!loading && fields.length > 0 && (
        <>
          {editMsg && (
            <div className={editMsg.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>
              {editMsg.text}
            </div>
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
                {fields.map(fd =>
                  deleteConfirmId === fd.id ? (
                    <tr key={fd.id} className="dash-confirm-row">
                      <td colSpan={5}>
                        <div className="dash-confirm-inline">
                          <span className="dash-confirm-text">{t('fieldDefs.deleteConfirmText')}</span>
                          <span className="dash-confirm-actions">
                            <button
                              className="dash-row-btn dash-row-btn-danger"
                              onClick={() => handleDelete(fd.id)}
                              disabled={deleting}
                            >
                              {deleting ? '…' : t('fieldDefs.deleteConfirmBtn')}
                            </button>
                            <button
                              className="dash-row-btn"
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={deleting}
                            >
                              {t('fieldDefs.cancel')}
                            </button>
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : editingId === fd.id ? (
                    <tr key={fd.id} className="dash-edit-row">
                      <td colSpan={5}>
                        <form onSubmit={handleSave} className="dash-row-edit-form">
                          <div className="dash-form-group">
                            <label>{t('fieldDefs.name')}</label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                              required
                              autoFocus
                            />
                          </div>
                          {fd.type === 'select' && (
                            <div className="dash-form-group">
                              <label>{t('fieldDefs.options')}</label>
                              <textarea
                                value={editForm.options}
                                onChange={e => setEditForm(f => ({ ...f, options: e.target.value }))}
                                style={{ minHeight: 56 }}
                              />
                            </div>
                          )}
                          <label className="dash-inline-checkbox">
                            <input
                              type="checkbox"
                              checked={editForm.required}
                              onChange={e => setEditForm(f => ({ ...f, required: e.target.checked }))}
                            />
                            {t('fieldDefs.required')}
                          </label>
                          <div className="dash-form-actions">
                            <button className="dash-submit-btn" type="submit" disabled={saving}>
                              {saving ? '…' : t('fieldDefs.saveBtn')}
                            </button>
                            <button className="dash-cancel-btn" type="button" onClick={() => setEditingId(null)}>
                              {t('fieldDefs.cancel')}
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={fd.id}>
                      <td>{fd.name}</td>
                      <td><span className={`dash-type-badge dash-target-${fd.target}`}>{targetLabel[fd.target]}</span></td>
                      <td><span className={`dash-type-badge dash-ftype-${fd.type}`}>{typeLabel[fd.type]}</span></td>
                      <td>{fd.required ? '✓' : '–'}</td>
                      <td>
                        <span className="dash-row-actions">
                          <button className="dash-row-btn" onClick={() => openEdit(fd)}>{t('hive.inspectionEditBtn')}</button>
                          <button className="dash-row-btn dash-row-btn-danger" onClick={() => setDeleteConfirmId(fd.id)}>{t('fieldDefs.deleteBtn')}</button>
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
    </DashboardShell>
  );
}
