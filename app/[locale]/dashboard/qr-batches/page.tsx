'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { getQrBatches, createQrBatch, type QrBatchSummary } from '@/lib/api';

export default function QrBatchesPage() {
  const t = useTranslations('dash');
  const [batches, setBatches] = useState<QrBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [count, setCount] = useState(10);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    getQrBatches()
      .then(data => setBatches(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      const batch = await createQrBatch(count);
      setBatches(prev => [{ id: batch.id, count: batch.count, created_at: batch.created_at, linked_count: 0 }, ...prev]);
      setShowCreate(false);
      setMessage({ type: 'ok', text: t('qrBatches.createSuccess') });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : t('qrBatches.errorGeneric') });
    } finally {
      setCreating(false);
    }
  }

  return (
    <DashboardShell>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('qrBatches.title')}</h1>
        {!showCreate && (
          <button className="dash-new-btn" onClick={() => { setShowCreate(true); setMessage(null); }}>
            {t('qrBatches.new')}
          </button>
        )}
      </div>

      {message && (
        <div className={message.type === 'ok' ? 'dash-success-banner' : 'dash-error-banner'}>
          {message.text}
        </div>
      )}

      {showCreate && (
        <div className="dash-inline-form">
          <h2>{t('qrBatches.createTitle')}</h2>
          <form onSubmit={handleCreate}>
            <div className="dash-form-group">
              <label>{t('qrBatches.count')}</label>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={e => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                required
                autoFocus
              />
            </div>
            <div className="dash-form-actions">
              <button className="dash-submit-btn" type="submit" disabled={creating}>
                {creating ? '…' : t('qrBatches.createBtn')}
              </button>
              <button className="dash-cancel-btn" type="button" onClick={() => setShowCreate(false)}>
                {t('qrBatches.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="spinner" />}
      {!loading && batches.length === 0 && !showCreate && (
        <p className="dash-empty">{t('qrBatches.empty')}</p>
      )}
      {!loading && batches.length > 0 && (
        <div className="dash-profile-card">
          <table className="dash-table">
            <thead>
              <tr>
                <th>{t('qrBatches.date')}</th>
                <th>{t('qrBatches.total')}</th>
                <th>{t('qrBatches.linked')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id}>
                  <td>{new Date(b.created_at).toLocaleDateString()}</td>
                  <td>{b.count}</td>
                  <td>{b.linked_count} / {b.count}</td>
                  <td>
                    <Link href={`/dashboard/qr-batches/${b.id}`} className="dash-row-btn">
                      {t('qrBatches.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
