'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { getQrBatch, downloadQrBatchPdf, type QrBatchOut } from '@/lib/api';

export default function QrBatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('dash');
  const [batch, setBatch] = useState<QrBatchOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  useEffect(() => {
    getQrBatch(id)
      .then(setBatch)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload() {
    setDownloading(true);
    setDlError(null);
    try {
      const blob = await downloadQrBatchPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-batch-${id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDlError(t('qrBatches.errorGeneric'));
    } finally {
      setDownloading(false);
    }
  }

  const linkedCount = batch?.tokens.filter(tk => tk.linked_hive_id).length ?? 0;

  return (
    <DashboardShell>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('qrBatches.detailTitle')}</h1>
        <Link href="/dashboard/qr-batches" className="dash-cancel-btn">{t('qrBatches.backToList')}</Link>
      </div>

      {loading && <div className="spinner" />}

      {!loading && batch && (
        <>
          <div className="dash-profile-card" style={{ marginBottom: 24 }}>
            <div className="dash-stat-row">
              <div className="dash-stat-pill">
                <span className="dash-stat-value">{batch.count}</span>
                <span className="dash-stat-label">{t('qrBatches.total')}</span>
              </div>
              <div className="dash-stat-pill">
                <span className="dash-stat-value">{linkedCount}</span>
                <span className="dash-stat-label">{t('qrBatches.linked')}</span>
              </div>
              <div className="dash-stat-pill">
                <span className="dash-stat-value">{new Date(batch.created_at).toLocaleDateString()}</span>
                <span className="dash-stat-label">{t('qrBatches.date')}</span>
              </div>
            </div>
            {dlError && <div className="dash-error-banner" style={{ marginTop: 12 }}>{dlError}</div>}
            <div style={{ marginTop: 16 }}>
              <button className="dash-submit-btn" onClick={handleDownload} disabled={downloading}>
                {downloading ? '…' : t('qrBatches.downloadPdf')}
              </button>
            </div>
          </div>

          <div className="dash-profile-card">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>{t('qrBatches.tokens')}</h2>
            <div className="dash-token-grid">
              {batch.tokens.map(tk => (
                <div key={tk.token} className={`dash-token-chip ${tk.linked_hive_id ? 'dash-token-linked' : 'dash-token-unlinked'}`}>
                  <span className="dash-token-uuid">{tk.token.slice(0, 8)}…</span>
                  <span className="dash-token-status">
                    {tk.linked_hive_id ? t('qrBatches.linkedBadge') : t('qrBatches.unlinkedBadge')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
