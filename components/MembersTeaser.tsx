'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getMe, type User } from '@/lib/api';

export default function MembersTeaser() {
  const t = useTranslations('members');
  const tp = useTranslations('price');
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getMe().then(setUser).catch(() => {}).finally(() => setChecked(true));
  }, []);

  const isSupporter = user?.is_supporter || user?.is_admin;

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
          <div className="members-preview-stat"><div className="num">3.2</div><div className="label">Avg Varroa (global)</div></div>
          <div className="members-preview-stat"><div className="num">78%</div><div className="label">Hives: Good Mood</div></div>
          <div className="members-preview-stat"><div className="num">6.4</div><div className="label">Avg Brood Frames</div></div>
          <div className="members-preview-stat"><div className="num">12d</div><div className="label">Avg Inspection Interval</div></div>
        </div>
        <div style={{ height: '120px', background: 'linear-gradient(90deg,#dcfce7,#fef3c7,#dcfce7)', borderRadius: '12px', opacity: .5, marginTop: '16px' }} />
      </div>

      {isSupporter ? (
        <div className="members-unlocked">
          <span className="members-unlocked-badge">✓ {t('gate.unlockedBadge')}</span>
          <p>{t('gate.unlockedNote')}</p>
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
