'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getMe, getPublicStats, type User, type PublicStats } from '@/lib/api';

export default function MembersTeaser() {
  const t = useTranslations('members');
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    Promise.all([
      getMe().catch(() => null),
      getPublicStats().catch(() => null),
    ]).then(([u, s]) => {
      setUser(u);
      setStats(s);
    }).finally(() => setChecked(true));
  }, []);

  const isSupporter = user?.is_supporter || user?.is_admin;

  const calmPct = stats
    ? (() => {
        const dist = stats.mood_distribution ?? {};
        const total = Object.values(dist).reduce((a, b) => a + b, 0);
        return total > 0 ? Math.round(((dist['calm'] ?? 0) / total) * 100) : null;
      })()
    : null;

  if (!checked) return null;

  return (
    <div className="members-teaser" data-aos="fade-up">
      <div className="members-teaser-header">
        <i className="fas fa-chart-bar" />
        <div>
          <h3>{t('teaser.title')}</h3>
          <p>{isSupporter ? t('teaser.subUnlocked') : t('teaser.sub')}</p>
        </div>
      </div>

      <div className="members-preview" style={isSupporter ? {} : { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
        <div className="members-preview-grid">
          <div className="members-preview-stat">
            <div className="num">{stats?.avg_varroa_count != null ? stats.avg_varroa_count.toFixed(1) : '—'}</div>
            <div className="label">{t('stat.avgVarroa')}</div>
          </div>
          <div className="members-preview-stat">
            <div className="num">{calmPct != null ? `${calmPct}%` : '—'}</div>
            <div className="label">{t('stat.goodMood')}</div>
          </div>
          <div className="members-preview-stat">
            <div className="num">{stats?.avg_brood_frames != null ? stats.avg_brood_frames.toFixed(1) : '—'}</div>
            <div className="label">{t('stat.avgBrood')}</div>
          </div>
          <div className="members-preview-stat">
            <div className="num">{stats?.avg_inspection_interval_days != null ? `${stats.avg_inspection_interval_days}d` : '—'}</div>
            <div className="label">{t('stat.interval')}</div>
          </div>
        </div>
        <div style={{ height: '120px', background: 'linear-gradient(90deg,#dcfce7,#fef3c7,#dcfce7)', borderRadius: '12px', opacity: .5, marginTop: '16px' }} />
      </div>

      {isSupporter ? (
        <div className="members-unlocked">
          <span className="members-unlocked-badge">✓ {t('gate.unlockedBadge')}</span>
        </div>
      ) : (
        <div className="members-gate">
          <h3>{t('gate.title')}</h3>
          <p>{t('gate.desc')}</p>
          <a href="/#download" className="btn-primary" style={{ display: 'inline-block', marginBottom: '8px' }} data-umami-event="members_get_app">{t('gate.cta')}</a>
          <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: '12px' }}>{t('gate.note')}</p>
        </div>
      )}
    </div>
  );
}
