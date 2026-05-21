'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { getHornetSightings, submitHornetSighting, voteOnSighting } from '@/lib/api';
import type { HornetSighting } from '@/lib/api';

export default function HornetCommunityPage() {
  const t = useTranslations('hornets');
  const [sightings, setSightings] = useState<HornetSighting[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  // Submit form
  const [showForm, setShowForm] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function load(p: number) {
    setLoading(true);
    getHornetSightings(p)
      .then(data => { setSightings(data.items); setPages(data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(page); }, [page]);

  async function vote(id: string, v: 'yes' | 'no') {
    setVoting(id + v);
    try {
      await voteOnSighting(id, v);
      load(page);
    } catch {} finally {
      setVoting(null);
    }
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    setSubmitError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/hornets/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setPhotoUrl(url);
    } catch {
      setSubmitError(t('report.uploadError'));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoUrl) { setSubmitError(t('community.photoRequired')); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitHornetSighting({ photo_url: photoUrl, description: description || null, reporter_name: reporterName || null });
      setSubmitSuccess(true);
      setShowForm(false);
      setPhotoUrl(''); setDescription(''); setReporterName('');
      load(1); setPage(1);
    } catch {
      setSubmitError(t('report.submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  const statusBadge = (s: HornetSighting['status']) => {
    if (s === 'confirmed') return <span className="hornets-badge hornets-badge-confirmed">{t('community.confirmed')}</span>;
    if (s === 'rejected') return <span className="hornets-badge hornets-badge-rejected">{t('community.rejected')}</span>;
    return <span className="hornets-badge hornets-badge-pending">{t('community.pending')}</span>;
  };

  return (
    <main className="hornets-community-page">
      <div className="hornets-community-header">
        <h1>{t('community.title')}</h1>
        <p>{t('community.subtitle')}</p>
        <button className="btn-primary" onClick={() => { setShowForm(s => !s); setSubmitSuccess(false); }}>
          {showForm ? '✕' : `+ ${t('community.addPhoto')}`}
        </button>
      </div>

      {submitSuccess && <div className="hornets-success">{t('community.submitSuccess')}</div>}

      {showForm && (
        <form className="hornets-form hornets-community-form" onSubmit={handleSubmit}>
          <label>
            {t('community.photo')} *
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }}
            />
            {uploadingPhoto && <span className="hornets-uploading">⏳ {t('report.uploading')}</span>}
            {photoUrl && <span className="hornets-photo-ok">✓ {t('report.photoReady')}</span>}
          </label>
          <label>
            {t('community.description')}
            <textarea rows={2} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <label>
            {t('report.name')}
            <input type="text" maxLength={100} value={reporterName} onChange={e => setReporterName(e.target.value)} placeholder={t('report.namePlaceholder')} />
          </label>
          {submitError && <div className="error-banner">{submitError}</div>}
          <button type="submit" className="btn-primary" disabled={submitting || uploadingPhoto}>
            {submitting ? '…' : t('community.submitPhoto')}
          </button>
        </form>
      )}

      {loading && <div className="spinner" />}

      {!loading && sightings.length === 0 && (
        <p className="dash-empty">{t('community.noSightings')}</p>
      )}

      {!loading && sightings.length > 0 && (
        <>
          <div className="hornets-grid">
            {sightings.map(s => (
              <div key={s.id} className="hornets-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.photo_url} alt="" className="hornets-card-img" />
                <div className="hornets-card-body">
                  {statusBadge(s.status)}
                  {s.description && <p className="hornets-card-desc">{s.description}</p>}
                  {s.reporter_name && <p className="hornets-card-reporter">— {s.reporter_name}</p>}

                  <div className="hornets-vote-row">
                    <button
                      className="hornets-vote-btn hornets-vote-yes"
                      onClick={() => vote(s.id, 'yes')}
                      disabled={voting !== null}
                    >
                      ✓ {t('community.vote.yes')} ({s.yes_votes})
                    </button>
                    <button
                      className="hornets-vote-btn hornets-vote-no"
                      onClick={() => vote(s.id, 'no')}
                      disabled={voting !== null}
                    >
                      ✗ {t('community.vote.no')} ({s.no_votes})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="dash-admin-pagination">
              <button className="dash-admin-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
              <span>{page} / {pages}</span>
              <button className="dash-admin-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
