'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const GITHUB_REPO = 'benni1984/apiscan';

export default function FeatureForm() {
  const t = useTranslations('fr');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('enhancement');
  const [platform, setPlatform] = useState('');
  const [desc, setDesc] = useState('');
  const [usecase, setUsecase] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) {
      alert('Please fill in the title and description.');
      return;
    }
    const platformLine = platform ? `**Platform:** ${platform}\n\n` : '';
    const usecasePart = usecase ? `### Use Case / Why\n${usecase}\n\n` : '';
    const body = [
      '### Description',
      desc.trim(),
      '',
      platformLine.trim() ? platformLine : '',
      usecasePart,
      '---',
      '*Submitted via [ApiScan website](https://apiscan.app)*',
    ].filter(Boolean).join('\n');

    const url = new URL(`https://github.com/${GITHUB_REPO}/issues/new`);
    url.searchParams.set('title', title.trim());
    url.searchParams.set('body', body);
    url.searchParams.set('labels', category);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }

  return (
    <form id="feature-form" noValidate onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="fr-title">{t('label.title')}</label>
        <input type="text" id="fr-title" required value={title} onChange={e => setTitle(e.target.value)} placeholder={t('ph.title')} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="fr-category">{t('label.cat')}</label>
          <select id="fr-category" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="enhancement">{t('cat.feature')}</option>
            <option value="bug">{t('cat.bug')}</option>
            <option value="enhancement">{t('cat.enhance')}</option>
            <option value="question">{t('cat.idea')}</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="fr-platform">{t('label.platform')}</label>
          <select id="fr-platform" value={platform} onChange={e => setPlatform(e.target.value)}>
            <option value="">{t('platform.all')}</option>
            <option value="iOS">{t('platform.ios')}</option>
            <option value="Android">{t('platform.android')}</option>
            <option value="Backend">{t('platform.backend')}</option>
            <option value="Website">{t('platform.web')}</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="fr-desc">{t('label.desc')}</label>
        <textarea id="fr-desc" rows={5} required value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('ph.desc')} />
      </div>
      <div className="form-group">
        <label htmlFor="fr-usecase">{t('label.usecase')}</label>
        <textarea id="fr-usecase" rows={3} value={usecase} onChange={e => setUsecase(e.target.value)} placeholder={t('ph.usecase')} />
      </div>
      <div className="fr-actions">
        <button type="submit" className="btn-primary">
          <i className="fab fa-github" /> {t('btn')}
        </button>
        <p className="fr-note">{t('note')}</p>
      </div>
    </form>
  );
}
