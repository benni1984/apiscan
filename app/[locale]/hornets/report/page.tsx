'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { submitHornetCatch, submitHornetNest } from '@/lib/api';

type Tab = 'catch' | 'nest';

export default function HornetReportPage() {
  const t = useTranslations('hornets');
  const [tab, setTab] = useState<Tab>('catch');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Catch form
  const [catchCount, setCatchCount] = useState(1);
  const [catchLat, setCatchLat] = useState('');
  const [catchLon, setCatchLon] = useState('');
  const [catchName, setCatchName] = useState('');

  // Nest form
  const [nestLat, setNestLat] = useState('');
  const [nestLon, setNestLon] = useState('');
  const [nestNotes, setNestNotes] = useState('');
  const [nestName, setNestName] = useState('');
  const [nestPhotoUrl, setNestPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setSuccess(false);
    setError('');
  }

  async function handleGps() {
    return new Promise<{ lat: number; lon: number } | null>(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 },
      );
    });
  }

  async function fillGps() {
    const pos = await handleGps();
    if (!pos) return;
    if (tab === 'catch') {
      setCatchLat(pos.lat.toFixed(6));
      setCatchLon(pos.lon.toFixed(6));
    } else {
      setNestLat(pos.lat.toFixed(6));
      setNestLon(pos.lon.toFixed(6));
    }
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/hornets/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setNestPhotoUrl(url);
    } catch {
      setError(t('report.uploadError'));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function submitCatch(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (catchCount < 1 || catchCount > 1000) { setError(t('report.countError')); return; }
    setLoading(true);
    try {
      await submitHornetCatch({
        count: catchCount,
        latitude: catchLat ? parseFloat(catchLat) : null,
        longitude: catchLon ? parseFloat(catchLon) : null,
        reporter_name: catchName || null,
      });
      setSuccess(true);
      setCatchCount(1); setCatchLat(''); setCatchLon(''); setCatchName('');
    } catch {
      setError(t('report.submitError'));
    } finally {
      setLoading(false);
    }
  }

  async function submitNest(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (!nestLat || !nestLon) { setError(t('report.locationRequired')); return; }
    setLoading(true);
    try {
      await submitHornetNest({
        latitude: parseFloat(nestLat),
        longitude: parseFloat(nestLon),
        notes: nestNotes || null,
        reporter_name: nestName || null,
        photo_url: nestPhotoUrl || null,
      });
      setSuccess(true);
      setNestLat(''); setNestLon(''); setNestNotes(''); setNestName(''); setNestPhotoUrl('');
    } catch {
      setError(t('report.submitError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hornets-report-page">
      <h1>{t('report.title')}</h1>

      <div className="dash-admin-tabs">
        <button
          className={`dash-admin-tab${tab === 'catch' ? ' active' : ''}`}
          onClick={() => { setTab('catch'); reset(); }}
        >
          {t('report.catchTab')}
        </button>
        <button
          className={`dash-admin-tab${tab === 'nest' ? ' active' : ''}`}
          onClick={() => { setTab('nest'); reset(); }}
        >
          {t('report.nestTab')}
        </button>
      </div>

      {success && (
        <div className="hornets-success">{t('report.success')}</div>
      )}
      {error && (
        <div className="error-banner">{error}</div>
      )}

      {tab === 'catch' && (
        <form className="hornets-form" onSubmit={submitCatch}>
          <label>
            {t('report.count')}
            <input
              type="number" min={1} max={1000}
              value={catchCount}
              onChange={e => setCatchCount(Number(e.target.value))}
              required
            />
          </label>

          <div className="hornets-location-row">
            <label>
              {t('report.latitude')}
              <input type="number" step="any" value={catchLat} onChange={e => setCatchLat(e.target.value)} placeholder="48.8566" />
            </label>
            <label>
              {t('report.longitude')}
              <input type="number" step="any" value={catchLon} onChange={e => setCatchLon(e.target.value)} placeholder="2.3522" />
            </label>
            <button type="button" className="btn-outline btn-sm" onClick={fillGps}>📍 GPS</button>
          </div>

          <label>
            {t('report.name')}
            <input type="text" maxLength={100} value={catchName} onChange={e => setCatchName(e.target.value)} placeholder={t('report.namePlaceholder')} />
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '…' : t('report.submit')}
          </button>
        </form>
      )}

      {tab === 'nest' && (
        <form className="hornets-form" onSubmit={submitNest}>
          <div className="hornets-location-row">
            <label>
              {t('report.latitude')} *
              <input type="number" step="any" value={nestLat} onChange={e => setNestLat(e.target.value)} placeholder="48.8566" required />
            </label>
            <label>
              {t('report.longitude')} *
              <input type="number" step="any" value={nestLon} onChange={e => setNestLon(e.target.value)} placeholder="2.3522" required />
            </label>
            <button type="button" className="btn-outline btn-sm" onClick={fillGps}>📍 GPS</button>
          </div>

          <label>
            {t('report.notes')}
            <textarea maxLength={2000} rows={3} value={nestNotes} onChange={e => setNestNotes(e.target.value)} />
          </label>

          <label>
            {t('report.photo')}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }}
            />
            {uploadingPhoto && <span className="hornets-uploading">⏳ {t('report.uploading')}</span>}
            {nestPhotoUrl && <span className="hornets-photo-ok">✓ {t('report.photoReady')}</span>}
          </label>

          <label>
            {t('report.name')}
            <input type="text" maxLength={100} value={nestName} onChange={e => setNestName(e.target.value)} placeholder={t('report.namePlaceholder')} />
          </label>

          <button type="submit" className="btn-primary" disabled={loading || uploadingPhoto}>
            {loading ? '…' : t('report.submit')}
          </button>
        </form>
      )}
    </main>
  );
}
